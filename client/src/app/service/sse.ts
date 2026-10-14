// Fed the full response text received so far; returns only the data of frames completed since the last call.
export function createSseDataReader(): (receivedText: string) => string[] {
  let consumedLength = 0;

  return (receivedText) => {
    const payloads: string[] = [];
    const frameEnd = /\r?\n\r?\n/g;
    frameEnd.lastIndex = consumedLength;

    let match: RegExpExecArray | null;
    while ((match = frameEnd.exec(receivedText)) !== null) {
      const frame = receivedText.slice(consumedLength, match.index);
      consumedLength = match.index + match[0].length;

      const data = frame
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice('data:'.length).replace(/^ /, ''))
        .join('\n');
      if (data) payloads.push(data);
    }

    return payloads;
  };
}
