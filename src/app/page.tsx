"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Code2, Database, Menu, Smartphone, X } from "lucide-react";

const services = [
  { n: "01", title: "Web Development", text: "Fast, responsive and modern websites built for real people.", icon: Code2 },
  { n: "02", title: "Mobile Applications", text: "Useful Android experiences with clean, intuitive interfaces.", icon: Smartphone },
  { n: "03", title: "Backend Systems", text: "Reliable APIs, databases and complete management platforms.", icon: Database },
];

const projects = [
  { n: "01", title: "WelfareX", type: "Full-stack management system", tone: "orange", tags: "NEXT.JS · MONGODB · TYPESCRIPT" },
  { n: "02", title: "MediCare", type: "Mobile appointment application", tone: "acid", tags: "ANDROID · JAVA · UI/UX" },
  { n: "03", title: "NewsBlog", type: "News content platform", tone: "paper", tags: "LARAVEL · PHP · MYSQL" },
];

export default function HomePage() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("in-view")),
      { threshold: 0.14 }
    );
    const nodes = document.querySelectorAll("[data-reveal]");
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="unifex-site">
      <header className="u-header">
        <a href="#home" className="u-logo"><span>◆</span> THARAKA</a>
        <nav className="u-socials"><a href="mailto:tharakajayasundara37@gmail.com">EMAIL</a><a href="#works">WORK</a><a href="#contact">CONTACT</a></nav>
        <a className="u-cv" href="#contact">LET&apos;S TALK <ArrowUpRight size={14} /></a>
        <button className="u-menu" onClick={() => setOpen(!open)} aria-label="Open menu">{open ? <X /> : <Menu />}</button>
        {open && <nav className="u-mobile-nav">{["About","Services","Works","Contact"].map(x=><a key={x} onClick={()=>setOpen(false)} href={`#${x.toLowerCase()}`}>{x}</a>)}</nav>}
      </header>

      <section className="u-hero" id="home">
        <div className="u-hero-word"><span>FULL-STACK</span>DEVELOPER</div>
        <div className="u-hero-left u-rise">
          <p className="u-mini-title">QUICK LINKS</p>
          <p>BASED IN SRI LANKA<br/>AVAILABLE WORLDWIDE</p>
          <div className="u-link-row"><a href="#works">PROJECTS</a><a href="#about">ABOUT ME</a></div>
        </div>
        <div className="u-portrait u-rise delay-1">
          <div className="u-orange-disc" />
          <Image src="/images/tharaka-cutout-v2.png" alt="Tharaka Jayasundara" fill priority sizes="(max-width: 700px) 86vw, 42vw" />
        </div>
        <div className="u-hero-right u-rise delay-2">
          <div><b>03+</b><span>PROJECTS<br/>COMPLETED</span></div>
          <div><b>04</b><span>CORE<br/>TECHNOLOGIES</span></div>
          <div><b>100%</b><span>PASSION FOR<br/>DEVELOPMENT</span></div>
        </div>
        <a href="#about" className="u-float-arrow"><ArrowDown size={18}/></a>
      </section>

      <div className="u-marquee"><div>WEB DEVELOPMENT ✦ MOBILE APPS ✦ UI DESIGN ✦ BACKEND SYSTEMS ✦ WEB DEVELOPMENT ✦ MOBILE APPS ✦ UI DESIGN ✦ BACKEND SYSTEMS ✦</div></div>

      <section className="u-manifesto" id="about">
        <div className="u-metric" data-reveal><strong>03+</strong><span>PROJECTS BUILT<br/>FROM IDEA TO PRODUCT</span></div>
        <h2 data-reveal>I AM DEDICATED TO BRINGING YOUR VISION TO LIFE BY CRAFTING UNIQUE, HIGHLY AESTHETIC, AND IMPACTFUL DIGITAL EXPERIENCES. <span>MY WORK SPEAKS LOUDER THAN WORDS.</span></h2>
        <a href="#works" className="u-lime-dot"><ArrowDown /></a>
      </section>

      <section className="u-about-detail">
        <div className="u-about-image" data-reveal><Image src="/images/tharaka-jayasundara.jpeg" alt="Tharaka at SLIATE" fill sizes="(max-width: 800px) 100vw, 50vw" /></div>
        <div className="u-about-copy" data-reveal>
          <p className="u-kicker">01 / WHO I AM</p>
          <h2>Creative thinking.<br/><span>Practical building.</span></h2>
          <p>I&apos;m Tharaka Jayasundara, an Information Technology student at SLIATE Kurunegala. I turn real-world challenges into straightforward web and mobile products.</p>
          <p>From interface design to databases and deployment, I enjoy shaping the complete experience.</p>
          <a href="#contact">MORE ABOUT ME <ArrowRight size={16}/></a>
          <div className="u-experience"><b>IT</b><span>Student &amp;<br/>Developer</span></div>
        </div>
      </section>

      <section className="u-services" id="services">
        <p className="u-kicker light">02 / WHAT I DO</p>
        <h2 data-reveal>SERVICES</h2>
        <div className="u-service-list">
          {services.map(({n,title,text,icon:Icon})=><article key={title} data-reveal><span>{n}</span><Icon/><div><h3>{title}</h3><p>{text}</p></div><ArrowUpRight className="u-service-arrow"/></article>)}
        </div>
        <div className="u-service-blob">CREATE<br/>BUILD<br/>GROW</div>
      </section>

      <section className="u-works" id="works">
        <div className="u-works-top"><p className="u-kicker">03 / SELECTED PROJECTS</p><span>SCROLL TO EXPLORE →</span></div>
        <h2 data-reveal>WORKS</h2>
        <div className="u-projects">
          {projects.map((project)=><article className={`u-project ${project.tone}`} key={project.title} data-reveal>
            <div className="u-project-meta"><span>{project.n}</span><span>{project.tags}</span></div>
            <div className="u-project-screen"><span className="screen-bar"/><strong>{project.title}</strong><small>{project.type}</small><div className="screen-button">VIEW CASE STUDY</div></div>
            <h3>{project.title}</h3><p>{project.type}</p>
          </article>)}
        </div>
      </section>

      <section className="u-contact" id="contact">
        <p className="u-kicker light">04 / GET IN TOUCH</p>
        <h2 data-reveal>LET&apos;S MAKE<br/>SOMETHING <span>GREAT.</span></h2>
        <a href="mailto:tharakajayasundara37@gmail.com" className="u-contact-link">THARAKAJAYASUNDARA37@GMAIL.COM <ArrowUpRight/></a>
        <footer><span>© 2026 THARAKA JAYASUNDARA</span><a href="#home">BACK TO TOP ↑</a></footer>
      </section>
    </main>
  );
}
