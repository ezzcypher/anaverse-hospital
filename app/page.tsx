import { Hero } from "@/components/hero";
import { SiteHeader } from "@/components/site-header";
import { Statement } from "@/components/statement";
import { Departments } from "@/components/departments";
import { Ambience } from "@/components/ambience";
import { Technology } from "@/components/technology";
import { Doctors } from "@/components/doctors";
import { Pricing } from "@/components/pricing";
import { Contact } from "@/components/contact";
import { SiteFooter } from "@/components/site-footer";
import { ChatWidget } from "@/components/chat/chat-widget";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="overflow-x-clip">
        <Hero />
        <Statement />
        <Departments />
        <Ambience />
        <Technology />
        <Doctors />
        <Pricing />
        <Contact />
      </main>
      <SiteFooter />
      <ChatWidget />
    </>
  );
}
