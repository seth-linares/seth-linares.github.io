// src/components/token_counter/FileContextProvider.tsx

import FileContext from "@/contexts/FileContext";
import { useFileContextProvider } from "@/hooks/token_counter/useFileContextProvider";

function FileContextProvider({children}: {children: React.ReactNode}) {
    const fileContextValue = useFileContextProvider();

    return(
        <FileContext.Provider value={fileContextValue}>
            {children}
        </FileContext.Provider>
    );
}

export default FileContextProvider;