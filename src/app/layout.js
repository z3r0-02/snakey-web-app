import "flag-icons/css/flag-icons.min.css";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";

export const metadata = {
  title: "Snakey",
  description:
    "A little project, where you can play the classic snake game and compete with other players for the highest score.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <div className="orb orb-1" aria-hidden="true"></div>
          <div className="orb orb-2" aria-hidden="true"></div>
          <div className="orb orb-3" aria-hidden="true"></div>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
