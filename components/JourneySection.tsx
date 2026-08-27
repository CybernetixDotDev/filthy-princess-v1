const journeySteps = [
  {
    title: "Discover",
    text: "You found something that made you stop.",
  },
  {
    title: "Enquire",
    text: "Tell Cally what brought you here.",
  },
  {
    title: "Connect",
    text: "We discover whether the experience feels right for both of us.",
  },
  {
    title: "Enter",
    text: "Invited guests gain access to the private pre-retreat world.",
  },
  {
    title: "Prepare",
    text: "Conversation, workshops, anticipation, embodiment and exploration begin.",
  },
  {
    title: "Arrive",
    text: "The digital world gives way to the retreat.",
  },
];

export default function JourneySection() {
  return (
    <section
      className="journey page-section"
      aria-labelledby="journey-title"
    >
      <div className="journey-inner section-shell">
        <div className="journey-intro">
          <p className="section-kicker">The retreat journey</p>
          <h2 id="journey-title">It begins before you arrive.</h2>
          <div className="prose-block">
            <p className="lead">
              Filthy Princess is not a weekend that begins when you check in.
            </p>
            <p>
              For guests who are invited further, the journey begins through a
              private portal before the retreat itself.
            </p>
            <p>
              It is a space to connect with Cally, discover what awaits, explore
              guided experiences and workshops, and gradually step away from the
              noise of ordinary life.
            </p>
            <p>
              The intention is simple: arrive already curious, comfortable,
              connected and ready to experience something different.
            </p>
          </div>
        </div>

        <ol
          className="journey-sequence"
          aria-label="Filthy Princess guest journey"
        >
          {journeySteps.map((step) => (
            <li className="journey-step" key={step.title}>
              <span>{step.title}</span>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
