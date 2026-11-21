import { router } from "@/router";
import { RouterProvider } from "@tanstack/react-router";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: "font-body",
          },
        }}
      />
    </>
  );
}
