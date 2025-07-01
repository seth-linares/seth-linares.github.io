// src/components/prompt_generator/FileContextProvider.tsx

import FileContext from "@/contexts/FileContext";
import { useFileContextProvider } from "@/hooks/prompt_generator/useFileContextProvider";

function FileContextProvider({children}: {children: React.ReactNode}) {
    const fileContextValue = useFileContextProvider();

    return(
        <FileContext.Provider value={fileContextValue}>
            {children}
        </FileContext.Provider>
    );
}

export default FileContextProvider;