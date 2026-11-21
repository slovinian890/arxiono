import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Manifesto } from "@/components/Manifesto";
import { Craft } from "@/components/Craft";
import { Partnership } from "@/components/Partnership";
import { IdeaFormSection } from "@/components/IdeaForm";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <Manifesto />
        <div className="checker-strip" />
        <Craft />
        <div className="checker-strip" />
        <Partnership />
        <IdeaFormSection />
      </main>
      <Footer />
    </>
  );
}
