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
