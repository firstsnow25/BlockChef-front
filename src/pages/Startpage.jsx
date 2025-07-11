import React from "react";
import { useNavigate } from "react-router-dom";
import example_image from "../assets/example_image.png";
import block_chef from "../assets/block_chef.png";
import new_block from "../assets/new_block.png";

const footerLinks = [
  { text: "System Status", href: "#" },
  { text: "Privacy Policy", href: "#" },
  { text: "Terms & Conditions", href: "#" },
];

const featureCards = [
  {
    id: 1,
    image: new_block,
    title:
      "More storage, plus features to protect your privacy and connect with friends",
    description:
      "iCloud is essential for keeping personal information from your devices safe, up to date, and available wherever you are. At iCloud.com, you can access your photos, files, and more from any web browser. Changes you make will sync to your iPhone and other devices, so you're always up to date.",
  },
  {
    id: 2,
    image: example_image,
    title:
      "More storage, plus features to protect your privacy and connect with friends",
    description:
      "Upgrade to iCloud+ to get more storage, plan events with Apple Invites, and have peace of mind with privacy features like iCloud Private Relay, Hide My Email, and HomeKit Secure Video. You can even share your subscription with your family. Learn more at",
    link: "apple.com/icloud",
  },
];

export default function Startpage() {
  const navigate = useNavigate(); // ✅ 추가

  return (
    <div className="relative w-[1920px] h-[1763px] bg-white">
      <div className="relative h-[1764px] overflow-scroll">
        <main className="absolute w-[1920px] h-[1478px] top-11 left-0">
          <section className="absolute w-[448px] h-[527px] top-0 left-[736px]">
            <div className="absolute w-[399px] h-[527px] top-0 left-[25px]">
              <h1 className="absolute w-[651px] h-[167px] top-[359px] left-[-126px] font-semibold text-[#000000e0] text-[127.6px] text-center tracking-[-2.80px] leading-[167px] whitespace-nowrap">
                BlockChef
              </h1>
            </div>

            <img
              className="absolute w-[448px] h-[351px] top-px left-0"
              alt="BlockChef app preview"
              src={block_chef}
            />
          </section>

          <section className="absolute w-[448px] h-[136px] top-[636px] left-[736px]">
            <p className="w-full h-full font-semibold text-[#000000e0] text-[35.8px] text-center leading-[44px]">
              개인화된 레시피를 생성,
              <br />
              저장 및 관리
            </p>
          </section>

          {/* ✅ 로그인 버튼에 onClick 추가 */}
          <div className="absolute w-[146px] h-11 top-[557px] left-[887px]">
            <button
              onClick={() => navigate("/signin")}
              className="all-[unset] box-border w-full h-full bg-black rounded-[22px] overflow-hidden cursor-pointer hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              type="button"
              aria-label="로그인 버튼"
            >
              <span className="block w-16 h-[23px] mt-[9px] ml-[41px] font-semibold text-white text-[19px] text-center leading-5 whitespace-nowrap">
                로그인
              </span>
            </button>
          </div>

          <section className="absolute w-[1350px] h-[595px] top-[883px] left-[285px]">
            {featureCards.map((card, index) => (
              <article
                key={card.id}
                className={`absolute w-[650px] h-[595px] top-0 ${index === 0 ? "left-0" : "left-[700px]"} bg-white rounded-[11px] shadow-[17px_20px_40px_#00000029]`}
              >
                <div className="absolute w-[472px] h-[280px] top-[18px] left-[86px]">
                  <img
                    className="absolute w-[472px] h-[280px] top-0 left-0 object-cover"
                    alt={`Feature illustration ${index + 1}`}
                    src={card.image}
                  />
                </div>

                <header className="absolute w-[570px] h-[100px] top-[310px] left-10">
                  <h3 className="absolute w-[519px] h-[66px] -top-0.5 left-0 font-semibold text-[#000000e0] text-[25px] leading-8">
                    {card.title}
                  </h3>
                </header>

                <div className="absolute w-[547px] h-24 top-[431px] left-10">
                  <p className="absolute w-[547px] h-[95px] top-0 left-0 font-normal text-[#000000e0] text-[16.9px] leading-[25px]">
                    {card.description}
                  </p>

                  {card.link && (
                    <a
                      href={`https://${card.link}`}
                      className="absolute w-[131px] h-5 top-[76px] left-[338px] text-[#0071e3] text-[16.9px] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {card.link}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </section>
        </main>

        <footer className="absolute w-[1920px] h-[82px] top-[1682px] left-0 bg-[#f2f2f7]">
          <nav className="absolute top-[33px] left-[442px]">
            {footerLinks.map((link, index) => (
              <React.Fragment key={link.text}>
                <a
                  href={link.href}
                  className="absolute h-[13px] text-[#0000008f] text-[10.8px] leading-[22px] hover:text-[#000000cc]"
                  style={{
                    left: index === 0 ? "0px" : index === 1 ? "96px" : "189px",
                    width:
                      index === 0 ? "75px" : index === 1 ? "72px" : "102px",
                  }}
                >
                  {link.text}
                </a>
                {index < footerLinks.length - 1 && (
                  <div
                    className="absolute w-px h-[15px] top-px bg-[#78788029]"
                    style={{
                      left: index === 0 ? "85px" : "178px",
                    }}
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            ))}
          </nav>

          <p className="absolute w-[250px] h-[22px] top-[29px] left-[1228px] text-[#0000008f] text-[11px] text-center leading-[22px]">
            Copyright © 2025 Apple Inc. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

