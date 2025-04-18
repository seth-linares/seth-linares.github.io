// src/utils/fileHelpers.ts

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      if (!event.target?.result) {
        console.log('Failed to read file');
        reject(new Error('Failed to read file'));
        return;
      }
      resolve(event.target.result as string);
    };
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
};

export const generateUniqueName = (file: File, existingNames: Set<string>): string => {
  let uniqueName = file.name;
  let counter = 1;
  while (existingNames.has(uniqueName)) {
    const dotIndex = file.name.lastIndexOf('.');
    if (dotIndex === -1) {
      uniqueName = `${file.name}_${counter}`;
    } else {
      const namePart = file.name.substring(0, dotIndex);
      const ext = file.name.substring(dotIndex);
      uniqueName = `${namePart}_${counter}${ext}`;
    }
    counter++;
  }
  existingNames.add(uniqueName);
  return uniqueName;
};
