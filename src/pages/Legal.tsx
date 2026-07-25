import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

const UPDATED = "June 2026";

function Legal({ title, children }: { title: string; children: ReactNode }) {
  const nav = useNavigate();
  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <button onClick={() => nav(-1)} className="label">‹ Back</button>
      <h1 className="mt-3 font-display text-5xl leading-none tracking-tight dot">{title}</h1>
      <p className="mt-3 label">Last updated: {UPDATED}</p>
      <div className="mt-10 space-y-9">{children}</div>
    </main>
  );
}

function H({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-2xl text-cream">{children}</h2>;
}
function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 leading-relaxed text-muted">{children}</p>;
}
function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-3 space-y-2.5 leading-relaxed text-muted">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function Terms() {
  return (
    <Legal title="Terms">
      <section>
        <H>1. The deal</H>
        <P>
          SameThing. (“we”, “the service”) is a space where people share short “things” — feelings,
          observations, confessions — and other people vote Same or Nah. By creating an account you agree
          to these terms. If you don't agree, please don't use the service.
        </P>
      </section>

      <section>
        <H>2. Who can join</H>
        <P>
          You must be at least 13 years old (16 in the EU/UK). You're responsible for keeping your account
          secure and for everything posted from it.
        </P>
      </section>

      <section>
        <H>3. What's not allowed</H>
        <List
          items={[
            "Hate speech, harassment, slurs, threats, or doxxing.",
            "Sexual content, explicit nudity, or content involving minors.",
            "Spam, scams, paid promotion without disclosure, or scraping.",
            "Impersonating others or claiming to represent SameThing.",
            "Encouraging self-harm or violence toward others.",
          ]}
        />
        <P>
          Posts that trip our safety filters are hidden automatically and may trigger warnings or a
          temporary mute. Three strikes mute your account for 24 hours. Severe violations can lead to
          permanent removal.
        </P>
      </section>

      <section>
        <H>4. Your content</H>
        <P>
          You keep ownership of what you post. By posting, you give SameThing. a non-exclusive, worldwide
          licence to host, display, and surface your content inside the service (feed, search, share previews).
          You can delete your content or your account at any time.
        </P>
      </section>

      <section>
        <H>5. AI features</H>
        <P>
          We use AI to help simplify your raw text into a clean “thing” and to assist moderation. AI output
          isn't perfect — if a simplification is wrong, edit it before posting or turn AI simplification off.
        </P>
      </section>

      <section>
        <H>6. PremiumThing</H>
        <P>
          Some features may be offered as a paid subscription. Billing, renewal, and refund terms will be
          shown at purchase. Cancel anytime from settings.
        </P>
      </section>

      <section>
        <H>7. No warranty</H>
        <P>
          The service is provided “as is”. We do our best to keep it running and safe, but we can't guarantee
          zero downtime, perfect moderation, or that you'll love every thing you read.
        </P>
      </section>

      <section>
        <H>8. Changes</H>
        <P>
          We may update these terms. If we change something material, we'll notify you in the app.
          Continued use after a change means you accept it.
        </P>
      </section>

      <section>
        <H>9. Contact</H>
        <P>
          Questions, takedowns, or appeals: reach out from the in-app report flow or by email at{" "}
          <a href="mailto:hello@samething.app" className="text-sand">hello@samething.app</a>.
        </P>
      </section>
    </Legal>
  );
}

export function Privacy() {
  return (
    <Legal title="Privacy">
      <section>
        <H>What we collect</H>
        <List
          items={[
            <><b className="text-cream/80">Account:</b> email, password hash, the username and emoji you pick.</>,
            <><b className="text-cream/80">Profile:</b> bio, language, your custom tags, your settings (e.g. open to chat).</>,
            <><b className="text-cream/80">Content:</b> the things and comments you post, your votes, reports you file.</>,
            <><b className="text-cream/80">Tech:</b> basic logs (IP, user-agent, timestamps) to keep the service healthy and prevent abuse.</>,
          ]}
        />
      </section>

      <section>
        <H>What we don't collect</H>
        <P>
          We don't sell your data. We don't run third-party advertising trackers. We don't ask for your contacts.
        </P>
      </section>

      <section>
        <H>How we use it</H>
        <List
          items={[
            "To run the service: log you in, show your feed, count Same/Nah.",
            "To moderate: detect spam, slurs, and unsafe content; act on reports.",
            "To improve: anonymous aggregate stats about feature usage.",
            "To contact you: critical service emails. Marketing only if you opt in.",
          ]}
        />
      </section>

      <section>
        <H>AI processing</H>
        <P>
          When you turn on AI simplification, the raw text of your draft is sent to our AI provider to be
          cleaned up and classified for safety. We don't allow that provider to train on your data. AI output
          is stored alongside your post.
        </P>
      </section>

      <section>
        <H>Anonymity</H>
        <P>
          “Post anonymously” hides your username from other readers, but the post is still linked to your
          account on our side so moderation works. If you break the rules in an anonymous post, it still
          counts against your account.
        </P>
      </section>

      <section>
        <H>Votes</H>
        <P>
          Nobody can see who voted what — not even the person who dropped the thing. Only the counts are
          public. Your own votes are visible to you alone.
        </P>
      </section>

      <section>
        <H>Your rights</H>
        <List
          items={[
            <><b className="text-cream/80">Access</b> — see your data from the Me screen.</>,
            <><b className="text-cream/80">Edit</b> — change your profile, bio, language.</>,
            <><b className="text-cream/80">Delete</b> — delete individual posts, or your whole account.</>,
            <><b className="text-cream/80">Export</b> — request a copy of your data by email.</>,
          ]}
        />
      </section>

      <section>
        <H>Where data lives</H>
        <P>
          We store data on managed cloud infrastructure with industry-standard encryption in transit and
          at rest. Backups are retained for a limited period after deletion.
        </P>
      </section>

      <section>
        <H>Contact</H>
        <P>
          Privacy questions or requests:{" "}
          <a href="mailto:privacy@samething.app" className="text-sand">privacy@samething.app</a>
        </P>
      </section>
    </Legal>
  );
}
