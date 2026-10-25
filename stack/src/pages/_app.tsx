import "@/src/styles/globals.css";
import NextApp from "next/app";
import type { AppContext, AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "@/src/lib/AuthContext";
import { LanguageProvider } from "@/src/i18n/LanguageContext";
import { languageFromCookieString } from "@/src/i18n/config";
import type { LanguageCode } from "@/src/i18n/config";
import Head from "next/head";

type AppWithLanguageProps = AppProps & { initialLanguage: LanguageCode };

export default function App({
  Component,
  pageProps,
  initialLanguage,
}: AppWithLanguageProps) {
  return (
    <>
      <Head>
        <title>Code-Quest</title>
      </Head>
      <AuthProvider>
        <LanguageProvider initialLanguage={initialLanguage}>
          <ToastContainer />
          <Component {...pageProps} />
        </LanguageProvider>
      </AuthProvider>
    </>
  );
}

// Reads the saved language from the cookie, so the server renders the right language
// from the very first load and there is no flash of English.
App.getInitialProps = async (appContext: AppContext) => {
  const appProps = await NextApp.getInitialProps(appContext);
  const cookieString =
    appContext.ctx.req?.headers.cookie ??
    (typeof document !== "undefined" ? document.cookie : undefined);
  return { ...appProps, initialLanguage: languageFromCookieString(cookieString) };
};