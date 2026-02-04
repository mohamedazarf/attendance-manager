// import React from "react";
// import ReactDOM from "react-dom/client";
// import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import App from "./App";

// const queryClient = new QueryClient();

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <QueryClientProvider client={queryClient}>
//       <ChakraProvider value={defaultSystem}>
//         <App />
//       </ChakraProvider>
//     </QueryClientProvider>
//   </React.StrictMode>
// );

import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);

