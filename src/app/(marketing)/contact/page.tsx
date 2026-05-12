import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact — SnapFix",
  description: "Talk to us about consulting or the SnapFix platform.",
};

export default function ContactPage() {
  return (
    <div className="text-slate-200">
      <section className="bg-night-hero">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <span className="text-sm uppercase tracking-wider text-indigo-300">Contact</span>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Talk to us</h1>
          <p className="mt-3 text-slate-300">
            Tell us a little about your firm and what you're trying to test. We'll get back within
            one working day.
          </p>
        </div>
      </section>
      <section className="bg-night-dots">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
