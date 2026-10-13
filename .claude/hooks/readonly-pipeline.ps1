# PreToolUse (Bash) hook: auto-approve READ-ONLY pipelines.
# Supersedes the earlier gh-api-only hook (it handles `gh api` as one case).
# Wired with no `if` in settings.json, so it runs for every Bash command; it
# stays silent (exit 0) for anything not provably read-only, so the only cost
# of the broad wiring is the check itself.
#
# Emits a PreToolUse "allow" ONLY when the whole Bash command is a single safe
# command or a `|`-pipeline in which EVERY stage is a non-mutating command. Anything it
# is not certain is read-only -> stays silent (exit 0) and the normal permission
# flow runs, so the worst case is a prompt, never an unintended auto-approval.
#
# Rejected outright (fall through to prompt): command chaining (; && || & and
# newlines), command/process substitution ($(...), backticks, <(...), >(...)),
# subshells, any output redirection (>, >>, and >& / 2>&1), and any stage that can
# write or execute (gh api writes, git write subcommands, sed -i / w / e / r,
# sort -o, uniq <in> <out>, tee, xargs, awk, sh, etc.).
#
# The stage scanner honours bash quoting AND backslash escaping: outside single
# quotes a `\` escapes the next char (so `\"` / `\;` are literal, not a quote
# toggle or separator). Without this an escaped quote could desync the quote-state
# machine and slip a real `;` past the scan -- e.g. `cat a\" ; rm -rf b\"` would be
# read as one safe `cat` stage and auto-approved while bash actually runs the `rm`.

$ErrorActionPreference = 'SilentlyContinue'

function Test-SafeStage([string]$st) {
    $s = $st.Trim()
    if (-not $s) { return $false }
    # Bash strips surrounding quotes AND backslash-escapes before executing, so a
    # quoted/escaped flag like `gh api "-XPOST"`, `gh api \-XPOST`, `sed "-i"`, or
    # `git diff "--output=f"` reaches the program as the bare flag. Run all
    # flag/subcommand checks against a normalized copy ($u: backslash-escapes
    # resolved, then quotes stripped, and tokens derived from it) so a quoted or
    # escaped dangerous flag can't evade them. (Normalizing only ever REVEALS flags
    # -> more rejections; the head/sub allowlists are exact matches, so it can never
    # turn a write into an allow.) NB: sed's *script* extraction below uses the
    # quoted $s on purpose.
    $u = ($s -replace '\\(.)', '$1') -replace '["'']', ''
    $t = $u -split '\s+'
    $head = $t[0]

    switch ($head) {
        'gh' {
            $sub = if ($t.Count -gt 1) { $t[1] } else { '' }
            switch ($sub) {
                'api' {
                    if ($u -match '(^|\s)(-X|--method)[\s=]*(post|put|patch|delete)\b') { return $false }
                    if ($u -match '(^|\s)(-[fF]\S*=|(-f|-F|--field|--raw-field|--input)(\s|=|$))') { return $false }
                    return $true
                }
                'pr'      { $p = if ($t.Count -gt 2) { $t[2] } else { '' }; return @('view','list','diff','checks','status') -contains $p }
                'release' { $p = if ($t.Count -gt 2) { $t[2] } else { '' }; return @('view','list') -contains $p }
                'search'  { return $true }
                default   { return $false }
            }
        }
        'git' {
            # Pre-subcommand GLOBAL options: -C <path> is chdir (read-safe); several globals can
            # execute arbitrary programs and are rejected:
            #   -c <cfg>=<val>     sets config inline (diff.external / sshCommand / pager)
            #   --config-env=...   sets the same config sourced from an env var (the -c sibling)
            #   --exec-path[=...]  redirects where git finds its git-<subcommand> binaries
            # -c is rejected ONLY here -- the same token after the subcommand (e.g. `git show -c`)
            # is a read-only combined-diff flag. Case-sensitive so -C is not treated as -c.
            $k = 1
            while ($k -lt $t.Count) {
                if ($t[$k] -ceq '-C') { $k += 2; continue }
                if ($t[$k] -clike '-c*') { return $false }
                if ($t[$k] -like '--config-env*' -or $t[$k] -like '--exec-path*') { return $false }
                if ($t[$k] -like '-*') { $k += 1; continue }
                break
            }
            $sub = if ($k -lt $t.Count) { $t[$k] } else { '' }
            if (-not (@('show','diff','log','status','ls-remote','ls-files','rev-parse',
                        'blame','describe','shortlog','for-each-ref','cat-file','show-ref','grep') -contains $sub)) {
                return $false
            }
            # Reject subcommand options that write or execute, even without a global -c:
            #   --output         writes a file (e.g. `git diff --output=f`)
            #   --ext-diff       runs the external diff driver (diff.external / diff.<d>.command)
            #   --textconv       runs a diff driver's textconv filter
            #   --open-files-in-pager  launches the pager on matches (git grep)
            # Long forms apply to every subcommand. The -O short form is subcommand-
            # ambiguous: `git diff -O<orderfile>` is a read-only order file, but
            # `git grep -O[<pager>]` is --open-files-in-pager and EXECUTES a pager --
            # so reject -O only for grep, where it is an exec vector.
            $execOrWrite = @('--output', '--ext-diff', '--textconv', '--open-files-in-pager')
            foreach ($tok in $t) {
                foreach ($bad in $execOrWrite) {
                    if ($tok -eq $bad -or $tok -like "$bad=*") { return $false }
                }
                if ($sub -eq 'grep' -and $tok -clike '-O*') { return $false }
            }
            return $true
        }
        'sed' {
            if ($u -match '(^|\s)(-i|--in-place)(\b|=)') { return $false }
            if ($u -match '(^|\s)(-f|--file)(\b|=)')     { return $false }
            $scripts = @()
            foreach ($m in [regex]::Matches($s, "'[^']*'")) { $scripts += $m.Value.Trim("'") }
            foreach ($m in [regex]::Matches($s, '"[^"]*"')) { $scripts += $m.Value.Trim('"') }
            if ($scripts.Count -eq 0) { return $false }   # unquoted sed script -> reject
            $addr    = '(\d+|\$|/[^/]*/)'
            $rng     = $addr + '(,' + $addr + ')?!?'
            $okPrint = '^\s*' + $rng + '\s*[pd=]\s*$'
            $okSubst = '^\s*' + $addr + '?\s*s/[^/]*/[^/]*/[gpiImMxX0-9]*\s*$'
            foreach ($scr in $scripts) {
                if (-not ($scr -match $okPrint -or $scr -match $okSubst)) { return $false }
            }
            return $true
        }
        'sort' { if ($u -match '(^|\s)(-o|--output)(\b|=)') { return $false }; return $true }
        'uniq' {
            # Guard the slice: with no args, `1..($t.Count-1)` would be the DESCENDING
            # range 1..0 -> indexes out of range AND wraps in $t[0] (the command itself)
            # as a phantom positional. Bare `uniq` is stdin -> stdout, no output file.
            if ($t.Count -le 1) { return $true }
            $pos = @($t[1..($t.Count - 1)] | Where-Object { $_ -and ($_ -notlike '-*') })
            if ($pos.Count -ge 2) { return $false }   # 2nd positional = output file (write)
            return $true
        }
        default {
            # Bash utilities only -- PowerShell cmdlets belong in the PowerShell tool,
            # not mixed into a Bash command (CLAUDE.md "keep shell commands simple").
            $filters = @('grep','egrep','fgrep','head','tail','cat','ls','wc','cut','tr','nl',
                         'rev','fold','jq','column','comm','tac','expand','unexpand')
            return ($filters -contains $head)
        }
    }
}

try {
    $raw = [Console]::In.ReadToEnd()
    if (-not $raw) { exit 0 }
    $j = $raw | ConvertFrom-Json
    $cmd = [string]$j.tool_input.command
    if (-not $cmd) { exit 0 }

    # Char-scan into pipe stages, rejecting every non-pipe shell construct.
    $stages = New-Object System.Collections.ArrayList
    $cur = ''; $sq = $false; $dq = $false
    for ($i = 0; $i -lt $cmd.Length; $i++) {
        $c = $cmd[$i]
        $n = if ($i + 1 -lt $cmd.Length) { $cmd[$i + 1] } else { [char]0 }
        # Backslash escapes the next char everywhere EXCEPT inside single quotes
        # (bash semantics). Consume both literally so an escaped quote or separator
        # (e.g. `\"` or `\;`) cannot desync the quote-state machine and smuggle an
        # unrejected `;`/`"` past the scan -- which would otherwise let a chained
        # write command (e.g. `cat a\" ; rm -rf b\"`) be auto-approved.
        if ($c -eq '\' -and -not $sq) {
            $cur += $c
            if ($i + 1 -lt $cmd.Length) { $cur += $n; $i++ }
            continue
        }
        if ($sq) { $cur += $c; if ($c -eq "'") { $sq = $false }; continue }
        if ($dq) {
            if ($c -eq '`') { exit 0 }
            if ($c -eq '$' -and $n -eq '(') { exit 0 }
            $cur += $c; if ($c -eq '"') { $dq = $false }; continue
        }
        if ($c -eq "'") { $sq = $true; $cur += $c; continue }
        if ($c -eq '"') { $dq = $true; $cur += $c; continue }
        if ($c -eq '`') { exit 0 }
        if ($c -eq '(' -or $c -eq ')') { exit 0 }
        if ($c -eq ';') { exit 0 }
        if ($c -eq "`n" -or $c -eq "`r") { exit 0 }
        if ($c -eq '$' -and $n -eq '(') { exit 0 }
        if ($c -eq '&') { exit 0 }   # any & (background, &&, or >& fd-dup) -> not auto-approved
        if ($c -eq '>') { exit 0 }   # any > redirection (incl. >& and 2>&1) -> not auto-approved
        if ($c -eq '|') { if ($n -eq '|') { exit 0 }; [void]$stages.Add($cur); $cur = ''; continue }
        $cur += $c
    }
    if ($sq -or $dq) { exit 0 }
    [void]$stages.Add($cur)

    foreach ($st in $stages) { if (-not (Test-SafeStage $st)) { exit 0 } }

    (@{ hookSpecificOutput = @{
        hookEventName            = 'PreToolUse'
        permissionDecision       = 'allow'
        permissionDecisionReason = 'Read-only pipeline (every stage non-mutating; no chaining, redirects or substitution); auto-approved by project hook.'
    } } | ConvertTo-Json -Compress -Depth 6)
    exit 0
}
catch { exit 0 }
