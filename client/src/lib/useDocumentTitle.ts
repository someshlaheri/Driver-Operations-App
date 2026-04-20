import { useEffect } from "react";

const APP_NAME = "Driver Operations";

export function useDocumentTitle(pageTitle: string) {
  useEffect(() => {
    document.title = `${pageTitle} | ${APP_NAME}`;

    return () => {
      document.title = APP_NAME;
    };
  }, [pageTitle]);
}
