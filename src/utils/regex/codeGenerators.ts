// src/utils/regex/codeGenerators.ts
import type { CodeGenOptions } from "@/types/regex";

export const generatePythonCode = (options: CodeGenOptions): string => {
  const { pattern, flags, testVarName = "text" } = options;
  const escaped = pattern.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  let flagsStr = "";
  if (flags.i) flagsStr += "re.IGNORECASE | ";
  if (flags.m) flagsStr += "re.MULTILINE | ";
  if (flags.s) flagsStr += "re.DOTALL | ";
  flagsStr = flagsStr.replace(/\s\|\s$/, ""); // remove trailing " | "

  return `import re

pattern = r'${escaped}'
${testVarName} = 'your text here'

# Find all matches
matches = re.finditer(pattern, ${testVarName}${flagsStr ? `, ${flagsStr}` : ''})

for match in matches:
    print(f"Match: {match.group()} at position {match.start()}-{match.end()}")
    # Print groups if any
    for i, group in enumerate(match.groups(), 1):
        print(f"  Group {i}: {group}")`;
};

export const generateJavaCode = (options: CodeGenOptions): string => {
  const { pattern, flags, testVarName = "text" } = options;
  const escaped = pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  let flagsInt = 0;
  // Java Pattern flags:
  // CASE_INSENSITIVE = 2, MULTILINE = 8, DOTALL = 32
  if (flags.i) flagsInt |= 2;
  if (flags.m) flagsInt |= 8;
  if (flags.s) flagsInt |= 32;

  return `import java.util.regex.*;

public class RegexExample {
    public static void main(String[] args) {
        String pattern = "${escaped}";
        String ${testVarName} = "your text here";

        Pattern p = Pattern.compile(pattern${flagsInt ? `, ${flagsInt}` : ''});
        Matcher m = p.matcher(${testVarName});

        while (m.find()) {
            System.out.println("Match: " + m.group() + " at " + m.start() + "-" + m.end());
            // Print groups if any
            for (int i = 1; i <= m.groupCount(); i++) {
                System.out.println("  Group " + i + ": " + m.group(i));
            }
        }
    }
}`;
};

export const generateCSharpCode = (options: CodeGenOptions): string => {
  const { pattern, flags, testVarName = "text" } = options;
  const escaped = pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const regexOptions: string[] = [];
  if (flags.i) regexOptions.push('RegexOptions.IgnoreCase');
  if (flags.m) regexOptions.push('RegexOptions.Multiline');
  if (flags.s) regexOptions.push('RegexOptions.Singleline');
  // Note: Global flag 'g' doesn't have direct equivalent in C# RegexOptions
  // JavaScript's sticky 'y' and unicode 'u' flags also don't have direct equivalents

  const optionsString = regexOptions.length > 0 
    ? `, ${regexOptions.join(' | ')}`
    : '';

  return `using System;
using System.Text.RegularExpressions;

class Program
{
    static void Main()
    {
        string pattern = "${escaped}";
        string ${testVarName} = "your text here";

        Regex regex = new Regex(pattern${optionsString});
        MatchCollection matches = regex.Matches(${testVarName});

        foreach (Match match in matches)
        {
            Console.WriteLine($"Match: {match.Value} at {match.Index}-{match.Index + match.Length}");
            
            // Print groups if any
            for (int i = 1; i < match.Groups.Count; i++)
            {
                Console.WriteLine($"  Group {i}: {match.Groups[i].Value}");
            }
        }
    }
}`;
};

export const generateTypeScriptCode = (options: CodeGenOptions): string => {
  const { pattern, flags, testVarName = "text" } = options;
  const escaped = pattern.replace(/\\/g, "\\\\").replace(/`/g, "\\`");

  let flagsStr = "";
  if (flags.g) flagsStr += "g";
  if (flags.i) flagsStr += "i";
  if (flags.m) flagsStr += "m";
  if (flags.s) flagsStr += "s";
  if (flags.u) flagsStr += "u";
  if (flags.y) flagsStr += "y";

  return `interface MatchResult {
  full: string;
  index: number;
  groups: (string | undefined)[];
}

const pattern: RegExp = new RegExp(\`${escaped}\`, \`${flagsStr}\`);
const ${testVarName}: string = 'your text here';
const matches: MatchResult[] = [];

let match: RegExpExecArray | null;
while ((match = pattern.exec(${testVarName})) !== null) {
  if (match.index === pattern.lastIndex) pattern.lastIndex++;
  
  matches.push({
    full: match[0],
    index: match.index,
    groups: match.slice(1)
  });
}

console.log(matches);`;
};
