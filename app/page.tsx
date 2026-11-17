import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import DocumentWorkflow from "@/components/DocumentWorkflow";
import Reconciliation from "@/components/Reconciliation";
import ApprovalWorkflow from "@/components/ApprovalWorkflow";
import KnowledgeScene from "@/components/KnowledgeScene";
import ApprovalLimits from "@/components/ApprovalLimits";
import Features from "@/components/Features";
import Outlook from "@/components/Outlook";
import PilotForm from "@/components/PilotForm";
import Footer from "@/components/Footer";
import ScrollManager from "@/components/ScrollManager";
import MobileTabBar from "@/components/MobileTabBar";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <DocumentWorkflow />
        <Reconciliation />
        <ApprovalWorkflow />
        <KnowledgeScene />
        <ApprovalLimits />
        <Features />
        <Outlook />
        <PilotForm />
      </main>
      <Footer />
      <MobileTabBar />
      <ScrollManager />
    </>
  );
}
