import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact — SnapFix",
  description: "Talk to us about consulting or the SnapFix platform.",
};

export default function ContactPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <header>
          <span className="text-sm uppercase tracking-wider text-indigo-700">Contact</span>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
            Talk to us
          </h1>
          <p className="mt-3 text-slate-600">
            Tell us a little about your firm and what you're trying to test. We'll get back within
            one working day.
          </p>
        </header>
        <div className="mt-10">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
