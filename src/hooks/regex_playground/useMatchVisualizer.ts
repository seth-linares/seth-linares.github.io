// import { useEffect } from "react";

// function useMatchVisualizer() {
//     useEffect(() => {
//     if (!onScrollToActive) return;
//     if (typeof activeGlobalIndex !== "number") return;
//     if (activeRef.current) {
//       activeRef.current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
//     }
//   }, [activeGlobalIndex, onScrollToActive]);

//   // Compute global index offsets per test block (pure calc – no hooks aside from effect above)
//   const blockOffsets: number[] = [];
//   {
//     let base = 0;
//     for (let i = 0; i < matches.length; i++) {
//       blockOffsets[i] = base;
//       base += matches[i].matches.length;
//     }
//   }
// }