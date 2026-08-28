import Image from "next/image";

import CallyIntroduction from "@/components/CallyIntroduction";
import Closing from "@/components/Closing";
import EnquiryForm from "@/components/EnquiryForm";
import ExperienceSection from "@/components/ExperienceSection";
import Hero from "@/components/Hero";
import PrivatePortalSection from "@/components/PrivatePortalSection";

export default function Page() {
  return (
    <main>
      <Hero />
      <CallyIntroduction />
      <section className="landing-logo-section" aria-label="Filthy Princess">
        <Image
          alt="Filthy Princess"
          className="landing-logo"
          height={140}
          src="/FilthyPrincessLogo.png"
          width={420}
        />
      </section>
      <PrivatePortalSection />
      <ExperienceSection />
      <EnquiryForm />
      <Closing />
    </main>
  );
}
