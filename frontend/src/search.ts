export interface TokenResult {
  text: string;
  status?: string;
  owner?: string;
  assignee?: string;
  hasFiles?: boolean;
  weightComparator?: '>' | '<' | '=';
  weightValue?: number;
}

const tokenPattern = /(\w+):([^\s]+)/g;

export function parseTokens(input: string): TokenResult {
  const result: TokenResult = { text: input };
  const tokens: Record<string, string> = {};
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(input)) !== null) {
    tokens[match[1].toLowerCase()] = match[2];
  }

  if (tokens.status) {
    result.status = tokens.status;
  }
  if (tokens.owner) {
    result.owner = tokens.owner;
  }
  if (tokens.assignee) {
    result.assignee = tokens.assignee;
  }
  if (tokens.has === 'files') {
    result.hasFiles = true;
  }
  if (tokens.weight) {
    const matchWeight = tokens.weight.match(/([><=])([0-9.]+)/);
    if (matchWeight) {
      result.weightComparator = matchWeight[1] as TokenResult['weightComparator'];
      result.weightValue = Number(matchWeight[2]);
    }
  }

  result.text = input
    .replace(tokenPattern, '')
    .trim()
    .replace(/\s{2,}/g, ' ');

  return result;
}
