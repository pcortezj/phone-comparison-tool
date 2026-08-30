import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';

const CONTACT_EMAIL = 'tronjcodes@gmail.com';
const EFFECTIVE_DATE = 'August 30, 2026';

export const metadata: Metadata = {
  title: 'Privacy Policy | DifferenceAI',
  description: 'How DifferenceAI handles information, in plain language.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="device-shell content-shell privacy-shell">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Privacy' }]} />
      <header>
        <span className="eyebrow">Privacy Policy</span>
        <h1>Privacy Policy</h1>
        <p className="lede">Effective {EFFECTIVE_DATE}</p>
      </header>

      <section>
        <h2>1. Information we collect</h2>

        <h3>Information you provide</h3>
        <p>
          If you email us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="ghost-link">
            {CONTACT_EMAIL}
          </a>
          , we (a person, not an automated system) receive your email address and whatever you
          write to us. DifferenceAI does not have user accounts, sign-up forms, or any other way
          to submit personal information through the site itself.
        </p>
        <p>
          If you use the AI assistant on a comparison or phone page, the question you type is sent
          to a third-party AI provider (see &ldquo;Third-party services&rdquo; below) to generate a
          response. That question text is not stored in our database.
        </p>

        <h3>Information collected automatically</h3>
        <p>
          DifferenceAI uses Vercel Web Analytics, a cookieless analytics service, to understand
          aggregate traffic and which interactions (like starting a comparison or clicking a buy
          link) are actually used. It does not use cookies or track you across other websites. See
          the full list of tracked interaction names below under &ldquo;How we use
          information.&rdquo;
        </p>
        <p>
          When you use the AI assistant, our server briefly uses your IP address to enforce a rate
          limit (a cap on how many questions can be asked per minute) so the feature isn&rsquo;t
          abused. This is held in server memory only, is never written to a database, and is
          discarded automatically after about a minute.
        </p>
        <p>
          Our hosting provider, Vercel, may log standard technical request information (such as IP
          address and request metadata) as part of operating and securing the service, in line
          with its own infrastructure practices.
        </p>
      </section>

      <section>
        <h2>2. How we use information</h2>
        <p>Information described above is used only to:</p>
        <ul>
          <li>Operate and maintain DifferenceAI</li>
          <li>Generate responses from the AI comparison assistant</li>
          <li>Understand, in aggregate, how visitors use the site (e.g. searches, comparisons started, buy-link clicks)</li>
          <li>Respond to emails sent to {CONTACT_EMAIL}</li>
          <li>Detect and prevent abuse of the AI assistant (rate limiting)</li>
        </ul>
        <p>We do not sell personal information or use it for advertising.</p>
      </section>

      <section>
        <h2>3. Affiliate links</h2>
        <p>
          Links to supported retailers (currently Amazon and eBay) on DifferenceAI are affiliate
          links. If you click one and make a qualifying purchase, DifferenceAI may receive a
          commission at no additional cost to you. Clicking an affiliate link may let the retailer
          or its affiliate network know that the visit came from DifferenceAI. Not every retailer
          we support is guaranteed to have an active affiliate link at all times &mdash; a button
          only appears for a retailer once real affiliate tracking is configured for it.
        </p>
      </section>

      <section>
        <h2>4. Third-party services</h2>
        <p>DifferenceAI relies on the following third-party services to operate:</p>
        <ul>
          <li>
            <strong>Vercel</strong> &mdash; hosting, and Vercel Web Analytics for cookieless
            aggregate usage statistics.
          </li>
          <li>
            <strong>Neon (Postgres)</strong> &mdash; database hosting for the phone catalog. It
            does not store any personal information about site visitors.
          </li>
          <li>
            <strong>OpenAI and/or Hugging Face Inference Providers</strong> &mdash; power the AI
            comparison assistant. When you ask the assistant a question, the phone specifications
            being discussed and your question text are sent to whichever provider is configured to
            generate an answer.
          </li>
          <li>
            <strong>Amazon Associates and eBay Partner Network</strong> &mdash; affiliate programs
            used for the &ldquo;Where to buy&rdquo; links described above.
          </li>
        </ul>
        <p>Each of these services has its own privacy policy governing how it handles data.</p>
      </section>

      <section>
        <h2>5. Cookies and similar technologies</h2>
        <p>
          DifferenceAI itself does not set cookies and does not use browser local storage or
          session storage to track you. The analytics service we use (Vercel Web Analytics) is
          designed to operate without cookies. We can&rsquo;t make guarantees about the retailers
          or affiliate networks you&rsquo;re taken to after clicking an outbound link &mdash; those
          are separate websites with their own practices.
        </p>
      </section>

      <section>
        <h2>6. Data retention</h2>
        <p>
          DifferenceAI does not maintain user accounts or personal profiles, so there is no
          personal data of that kind to retain. Emails sent to {CONTACT_EMAIL} are kept in that
          inbox for as long as needed to address the request. Rate-limit data is held in server
          memory for roughly a minute and then discarded.
        </p>
      </section>

      <section>
        <h2>7. Data security</h2>
        <p>
          We take reasonable measures to protect information handled through DifferenceAI, but no
          internet service can guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>8. Children&rsquo;s privacy</h2>
        <p>
          DifferenceAI is not directed toward children and is not designed to knowingly collect
          personal information from children.
        </p>
      </section>

      <section>
        <h2>9. Your rights</h2>
        <p>
          Depending on where you live, you may have rights regarding personal information
          collected about you. You can contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="ghost-link">
            {CONTACT_EMAIL}
          </a>{' '}
          with privacy-related requests.
        </p>
      </section>

      <section>
        <h2>10. Changes to this policy</h2>
        <p>
          This policy may be updated from time to time. If we make material changes, we&rsquo;ll
          update the effective date above.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p>
          Privacy questions:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="ghost-link">
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>
    </main>
  );
}
