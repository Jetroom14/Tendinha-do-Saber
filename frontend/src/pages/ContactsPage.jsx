import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Clock,
  MessageCircle,
  UserRound,
} from "lucide-react";

export default function ContactsPage() {
  return (
    <div className="contacts-final-page" data-testid="contacts-page">

      <section className="contacts-final-hero">
        <img
          src="/branding/heroes/hero-contactos.png"
          alt=""
          aria-hidden="true"
        />

        <div className="contacts-final-hero-copy">
          <div className="final-page-eyebrow">
            Contactos
          </div>

          <h1>Fale connosco</h1>

          <p>
            Estamos aqui para ajudar com a sua lista escolar.
          </p>
        </div>
      </section>


      <section className="contacts-final-info">

        <div className="contacts-final-business">

          <div className="contacts-final-heading">
            <span>
              <MessageCircle />
            </span>

            <h2>Tendinha do Saber</h2>
          </div>


          <ul>
            <li>
              <MapPin />
              <div>Aveiro, Portugal</div>
            </li>

            <li>
              <Phone />

              <div>
                <a href="tel:+351961194491">
                  +351 961 194 491
                </a>

                <small>
                  Chamada para rede móvel nacional
                </small>
              </div>
            </li>

            <li>
              <Mail />

              <a href="mailto:tendinhadosaber@gmail.com">
                tendinhadosaber@gmail.com
              </a>
            </li>

            <li>
              <Instagram />

              <a
                href="https://www.instagram.com/tendinhadosaber/"
                target="_blank"
                rel="noreferrer"
              >
                @tendinhadosaber
              </a>
            </li>
          </ul>


          <div className="contacts-final-hours">
            <div>
              <Clock />
              <span>Horário de atendimento</span>
            </div>

            <p>Segunda a Sábado · 9h00 — 19h00</p>
            <p>Encomendas online disponíveis 24h.</p>
          </div>
        </div>


        <div className="contacts-final-owner">

          <div className="contacts-final-heading">
            <span>
              <UserRound />
            </span>

            <h2>Responsável</h2>
          </div>

          <p className="contacts-owner-name">
            Francisco Neves Tendinha
          </p>

          <p className="contacts-owner-description">
            Há mais de uma década dedicado a equipar as escolas e famílias
            da região com os melhores manuais e materiais educativos.
          </p>

        </div>

      </section>
    </div>
  );
}
