# PreToolUse (Bash) hook: DENY chaining an `echo` header/label onto other commands.
#
# Enforces the CLAUDE.md "keep shell commands simple" rule. If the command
# sequences an `echo` segment together with other commands via ; && || a lone &
# (background) or a newline (e.g. `echo "=== REVIEWS ===" && gh pr view ...`), it is denied with
# guidance to run the query standalone. Piping echo (`echo x | y`), a lone
# `echo`, and pure all-`echo` chains are NOT denied -- only an `echo` segment
# sequenced with a non-`echo` command.

$ErrorActionPreference = 'SilentlyContinue'
try {
    $raw = [Console]::In.ReadToEnd()
    if (-not $raw) { exit 0 }
    $j = $raw | ConvertFrom-Json
    $cmd = [string]$j.tool_input.command
    if (-not $cmd) { exit 0 }

    # Split on sequencing separators ( ; && || a lone & background op, and newline ),
    # respecting quotes. Pipes ( | ) are intentionally NOT separators here.
    $segs = New-Object System.Collections.ArrayList
    $cur = ''; $sq = $false; $dq = $false
    for ($i = 0; $i -lt $cmd.Length; $i++) {
        $c = $cmd[$i]
        $n = if ($i + 1 -lt $cmd.Length) { $cmd[$i + 1] } else { [char]0 }
        # Backslash escapes the next char everywhere EXCEPT inside single quotes
        # (bash semantics). Consume both literally so an escaped quote (e.g. `\"`)
        # can't desync the quote-state machine and make a quoted `&&`/`;` look like
        # a real separator -- which would spuriously deny e.g. `echo "x\" && y"`.
        if ($c -eq '\' -and -not $sq) {
            $cur += $c
            if ($i + 1 -lt $cmd.Length) { $cur += $n; $i++ }
            continue
        }
        if ($sq) { if ($c -eq "'") { $sq = $false }; $cur += $c; continue }
        if ($dq) { if ($c -eq '"') { $dq = $false }; $cur += $c; continue }
        if ($c -eq "'") { $sq = $true; $cur += $c; continue }
        if ($c -eq '"') { $dq = $true; $cur += $c; continue }
        if ($c -eq ';') { [void]$segs.Add($cur); $cur = ''; continue }
        if ($c -eq "`n" -or $c -eq "`r") { [void]$segs.Add($cur); $cur = ''; continue }
        if ($c -eq '&' -and $n -eq '&') { [void]$segs.Add($cur); $cur = ''; $i++; continue }
        if ($c -eq '&') {
            # A lone `&` is the background operator -> a command separator. Exclude the
            # redirection forms that also contain `&`: `&>`/`&>>` (next char `>`) and
            # `>&`/`2>&1` (previous char `>`); those are not separators.
            $p = if ($i -gt 0) { $cmd[$i - 1] } else { [char]0 }
            if ($n -eq '>' -or $p -eq '>') { $cur += $c; continue }
            [void]$segs.Add($cur); $cur = ''; continue
        }
        if ($c -eq '|' -and $n -eq '|') { [void]$segs.Add($cur); $cur = ''; $i++; continue }
        $cur += $c
    }
    [void]$segs.Add($cur)

    if ($segs.Count -le 1) { exit 0 }   # not a sequenced chain

    $hasEcho = $false; $hasOther = $false
    foreach ($s in $segs) {
        $trimmed = $s.Trim()
        if (-not $trimmed) { continue }   # skip empties from trailing/doubled separators (e.g. `echo hi;`)
        if (($trimmed -split '\s+')[0] -eq 'echo') { $hasEcho = $true } else { $hasOther = $true }
    }
    if (-not ($hasEcho -and $hasOther)) { exit 0 }   # only deny echo chained with a non-echo command

    $reason = 'Do not chain an `echo` header/label onto commands (e.g. `echo "=== X ===" && cmd`). Run each query standalone, without echo delimiters -- see CLAUDE.md "keep shell commands simple". Standalone read-only queries stay within the allow rules and the read-only pipeline hook.'
    (@{ hookSpecificOutput = @{
        hookEventName            = 'PreToolUse'
        permissionDecision       = 'deny'
        permissionDecisionReason = $reason
    } } | ConvertTo-Json -Compress -Depth 6)
    exit 0
}
catch { exit 0 }
