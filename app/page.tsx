import CallyIntroduction from "@/components/CallyIntroduction";
import Closing from "@/components/Closing";
import EnquiryForm from "@/components/EnquiryForm";
import ExperienceSection from "@/components/ExperienceSection";
import Hero from "@/components/Hero";
import JourneySection from "@/components/JourneySection";
import PrivatePortalSection from "@/components/PrivatePortalSection";

export default function Page() {
  return (
    <main>
      <Hero />
      <CallyIntroduction />
      <JourneySection />
      <PrivatePortalSection />
      <ExperienceSection />
      <EnquiryForm />
      <Closing />
    </main>
  );
}
