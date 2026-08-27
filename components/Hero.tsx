import Image from "next/image";
import EnchantedLaceImage from "../public/EnchantedLace.png";

export default function Hero() {
  return (
    <section className="hero section-shell" aria-labelledby="hero-title">
      <div className="tiny-mark" aria-label="Filthy Princess">
        Filthy Princess
      </div>
      <a className="enter-link" href="/access">
        Enter
      </a>

      <div className="hero-content">
        <p className="eyebrow">A private adult retreat experience</p>
        <h1 id="hero-title">Filthy Princess</h1>
        <p className="hero-statement">Some doors are not advertised.</p>
        <p className="hero-copy">
          Enter the private world of Cally - a Futanari Princess creating
          intimate retreat experiences around sensuality, energy, curiosity and
          connection.
        </p>
        <p className="hero-bridge">
          The retreat may be the destination. The experience begins long before
          you arrive.
        </p>
        <p className="hero-soft">
          For the curious. For the receptive. For those who feel the
          invitation.
        </p>
        <div className="hero-actions">
          <a className="primary-cta" href="#meet-cally">
            Come closer
          </a>
          <a className="scroll-cue" href="#meet-cally">
            Discover
          </a>
        </div>
      </div>

      <figure className="hero-image" aria-label="Enchanted lace atmosphere">
        <Image
          src={EnchantedLaceImage}
          alt="Enchanted lace in deep plum and antique-gold light"
          fill
          priority
          sizes="(min-width: 861px) 31rem, 0px"
        />
      </figure>
    </section>
  );
}
