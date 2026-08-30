import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';

const CONTACT_EMAIL = 'tronjcodes@gmail.com';

export const metadata: Metadata = {
  title: 'Contact DifferenceAI',
  description:
    'Contact DifferenceAI with questions, feedback, a specification correction, or a phone you would like to see added to the catalog.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <main className="device-shell content-shell">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
      <header>
        <span className="eyebrow">Contact</span>
        <h1>Contact DifferenceAI</h1>
        <p className="lede">
          Have a question, found an incorrect specification, or have a phone you&rsquo;d like to
          see added to DifferenceAI?
        </p>
      </header>

      <section className="comparison-section">
        <p>Get in touch at</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="primary-button">
          {CONTACT_EMAIL}
        </a>
      </section>

      <div className="feature-grid">
        <div>
          <h3>Report incorrect information</h3>
          <p>
            Found a specification that looks wrong? Let us know which phone and which
            specification needs correction.
          </p>
        </div>
        <div>
          <h3>Suggest a phone</h3>
          <p>Can&rsquo;t find a device in the catalog? Send us the phone model and we&rsquo;ll take a look.</p>
        </div>
        <div>
          <h3>General questions</h3>
          <p>Questions, feedback, partnership inquiries, or anything else related to DifferenceAI are welcome.</p>
        </div>
      </div>
    </main>
  );
}
