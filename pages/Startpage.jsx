// src/pages/Startpage.jsx
import React from "react";
import example_image from "../assets/example_image.png";
import block_chef from "../assets/block_chef.png";
import new_block from "../assets/new_block.png";
import { useNavigate } from "react-router-dom";

const footerLinks = [
  { text: "System Status", href: "#" },
  { text: "Privacy Policy", href: "#" },
  { text: "Terms & Conditions", href: "#" },
];

const featureCards = [
  {
    id: 1,
    image: new_block,
    title: "블록을 드래그 하여 요리과정을 쉽게 설계",
    description:
      "직관적인 인터페이스를 통해 누구나 손쉽게 요리 과정을 만들고 시뮬레이션 가능하게 설계하였습니다. 반복, 조건, 동작 등을 조합해 나만의 레시피를 만듭니다",
  },
  {
    id: 2,
    image: example_image,
    title: "개인화 된 레시피 저장과 관리",
    description:
      "저장한 레시피는 언제든지 수정, 삭제가 가능하고, 개인 페이지에서 관리할 수 있습니다. 직관적인 UI로 쉽게 접근하고 관리가 가능하며 언제든지 수정과 삭제가 가능합니다.",
    
  },
];

export default function Startpage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-white">
      <main className="w-full max-w-[1920px] mx-auto">
        <section className="flex flex-col items-center pt-12">
          <img
            src={block_chef}
            alt="BlockChef Logo"
            className="w-[356px] h-[356px]"
          />

          <h1 className="mt-10 text-[120px] font-semibold text-black text-center leading-none">
            BlockChef
          </h1>

          <p className="mt-8 text-[36px] font-semibold text-center text-black">
            개인화된 레시피를 생성,
            <br /> 저장 및 관리
          </p>

          <button
            onClick={() => navigate("/signin")}
            className="mt-6 px-10 py-3 bg-black text-white rounded-full text-[19px] hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            로그인
          </button>
        </section>

        <section className="mt-24 flex justify-center gap-10 px-4">
          {featureCards.map((card, index) => (
            <article
              key={card.id}
              className="w-[650px] bg-white rounded-xl shadow-lg p-6 space-y-4"
            >
              <img
                src={card.image}
                alt={`Feature ${index + 1}`}
                className="w-full h-[280px] object-cover"
              />
              <h3 className="text-xl font-semibold text-black">
                {card.title}
              </h3>
              <p className="text-sm text-gray-700">
                {card.description}
                {card.link && (
                  <a
                    href={`https://${card.link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline ml-1"
                  >
                    {card.link}
                  </a>
                )}
              </p>
            </article>
          ))}
        </section>

        
      </main>
      <footer className="mt-24 py-6 bg-gray-100 text-center text-xs text-gray-600">
          <div className="flex justify-center space-x-6">
            {footerLinks.map((link) => (
              <a
                key={link.text}
                href={link.href}
                className="hover:text-black"
              >
                {link.text}
              </a>
            ))}
          </div>
          <p className="mt-2">© 2025 BlockChef. All rights reserved.</p>
        </footer>
    </div>
  );
}
