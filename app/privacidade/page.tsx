import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade e Proteção de Dados (LGPD) | Quero Ser Brigadista",
  description:
    "Saiba como tratamos seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#FAF4E6] text-[#18181B] flex flex-col justify-between">
      {/* CABEÇALHO */}
      <header className="w-full bg-[#18181B] text-[#FAF4E6] border-b-4 border-[#18181B] py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-poster text-xl sm:text-2xl text-[#FEF08A] tracking-wider uppercase hover:underline"
          >
            ← Voltar para Inscrição
          </Link>
          <span className="font-poster text-xs sm:text-sm bg-[#B91C1C] text-white px-2.5 py-1 uppercase border border-[#FEF08A]">
            LGPD &bull; Lei 13.709/2018
          </span>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-4xl mx-auto px-4 py-10 sm:py-12 flex-1 w-full">
        <article className="bg-[#FFFDF8] border-4 border-[#18181B] shadow-poster-lg p-6 sm:p-10 flex flex-col gap-6">
          <div className="border-b-4 border-[#18181B] pb-4">
            <span className="bg-[#FEF08A] text-[#18181B] font-poster text-xs sm:text-sm px-3 py-1 uppercase border-2 border-[#18181B] inline-block mb-2 font-bold">
              Transparência e Respeito aos Seus Direitos
            </span>
            <h1 className="font-poster text-3xl sm:text-4xl uppercase text-[#18181B]">
              Política de Privacidade e Termo de Consentimento
            </h1>
            <p className="text-sm text-[#71717A] mt-1 font-mono">
              Última atualização: Novembro de 2026 &bull; Em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)
            </p>
          </div>

          <section className="flex flex-col gap-3 text-base leading-relaxed">
            <h2 className="font-poster text-2xl uppercase text-[#B91C1C] flex items-center gap-2">
              <span>1.</span> Finalidade do Tratamento de Dados
            </h2>
            <p>
              O projeto popular <strong>Quero Ser Brigadista Comunitário</strong> tem como objetivo organizar e conectar voluntários, moradores e lideranças territoriais para a formação, capacitação e atuação comunitária em prevenção e combate a queimadas e incêndios florestais.
            </p>
            <p>
              Os dados coletados neste site possuem finalidade exclusiva de articulação social e cidadã, não possuindo qualquer intuito lucrativo, comercial ou publicitário.
            </p>
          </section>

          <section className="flex flex-col gap-3 text-base leading-relaxed">
            <h2 className="font-poster text-2xl uppercase text-[#B91C1C] flex items-center gap-2">
              <span>2.</span> Quais Dados Coletamos e Por Quê
            </h2>
            <p>
              Em conformidade com o <em>Princípio da Necessidade e Minimização</em> (Art. 6º, III da LGPD), coletamos apenas o mínimo necessário para viabilizar o contato e a organização das brigadas:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Nome Completo:</strong> Identificação do voluntário para listas de chamada em treinamentos e articulação.
              </li>
              <li>
                <strong>Data de Nascimento:</strong> Identificação da faixa etária para direcionar corretamente a atuação do voluntário (maiores de 18 anos para capacitação e combate direto; menores de 18 anos exclusivamente para atividades seguras de mobilização e pressão popular junto ao poder público).
              </li>
              <li>
                <strong>Telefone / WhatsApp:</strong> Canal direto e prioritário de comunicação para convites de oficinas, reuniões e mobilizações locais.
              </li>
              <li>
                <strong>E-mail (opcional):</strong> Canal alternativo de comunicação.
              </li>
              <li>
                <strong>Estado, Cidade, Bairro ou Comunidade Rural:</strong> Localização geográfica fundamental para agrupar os voluntários por cidade, bairro ou comunidade.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-3 text-base leading-relaxed">
            <h2 className="font-poster text-2xl uppercase text-[#B91C1C] flex items-center gap-2">
              <span>3.</span> Base Legal para o Tratamento (Art. 7º, I da LGPD)
            </h2>
            <p>
              O tratamento de seus dados é fundamentado no seu <strong>Consentimento Livre, Informado e Inequívoco</strong> (Art. 7º, inciso I da LGPD), manifestado expressamente ao preencher e submeter o formulário de inscrição.
            </p>
          </section>

          <section className="flex flex-col gap-3 text-base leading-relaxed">
            <h2 className="font-poster text-2xl uppercase text-[#B91C1C] flex items-center gap-2">
              <span>4.</span> Compartilhamento de Dados com Lideranças Regionais
            </h2>
            <p>
              Suas informações de contato e localização territorial serão compartilhadas <strong>exclusivamente</strong> com instrutores, coordenadores e lideranças comunitárias da sua região específica para organização de treinamentos e apoio operacional.
            </p>
            <p className="bg-[#FEF9C3] p-3 border-2 border-[#18181B] font-semibold text-sm">
              ⚠ Seus dados jamais serão comercializados, cedidos a empresas privadas ou utilizados para fins eleitorais ou comerciais.
            </p>
          </section>

          <section className="flex flex-col gap-3 text-base leading-relaxed">
            <h2 className="font-poster text-2xl uppercase text-[#B91C1C] flex items-center gap-2">
              <span>5.</span> Participação de Adolescentes e Menores de 18 Anos (Art. 14 da LGPD)
            </h2>
            <p>
              A defesa da floresta e das comunidades é construída por todas as gerações, respeitando a segurança e a proteção integral de jovens e adolescentes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Maiores de 18 anos:</strong> Podem atuar diretamente nos treinamentos operacionais, brigadas de prevenção e linhas de frente comunitárias.
              </li>
              <li>
                <strong>Menores de 18 anos:</strong> Não participam de combate direto a incêndios ou atividades de risco físico, mas atuam de forma organizada na <strong>mobilização social, comunicação comunitária e pressão popular sobre o Estado</strong> para exigir a entrega de equipamentos e a realização de treinamentos para os brigadistas.
              </li>
            </ul>
            <p>
              Em estrito cumprimento ao <strong>Art. 14 da LGPD</strong>, o tratamento de dados de voluntários menores de 18 anos é realizado sempre em seu melhor interesse e mediante declaração expressa de consentimento específico concedido por pelo menos um dos pais ou responsável legal no momento da inscrição.
            </p>
          </section>

          <section className="flex flex-col gap-3 text-base leading-relaxed">
            <h2 className="font-poster text-2xl uppercase text-[#B91C1C] flex items-center gap-2">
              <span>6.</span> Seus Direitos como Titular dos Dados (Art. 18 da LGPD)
            </h2>
            <p>
              Você possui controle total sobre suas informações. A qualquer momento, você pode solicitar:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmação da existência de tratamento dos seus dados;</li>
              <li>Acesso aos seus dados registrados;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>
                <strong>Eliminação e exclusão completa</strong> de seus dados pessoais da nossa base;
              </li>
              <li>Revogação do consentimento previamente concedido.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3 text-base leading-relaxed">
            <h2 className="font-poster text-2xl uppercase text-[#B91C1C] flex items-center gap-2">
              <span>7.</span> Canal de Contato e Encarregado de Dados
            </h2>
            <p>
              Para exercer qualquer dos seus direitos ou tirar dúvidas sobre como seus dados são geridos, entre em contato diretamente com a nossa coordenação comunitária pelo canal:
            </p>
            <div className="bg-[#E4E4E7] border-2 border-[#18181B] p-4 text-sm font-mono flex flex-col gap-1">
              <span><strong>Coordenação de Proteção de Dados:</strong> Articulação Quero Ser Brigadista</span>
              <span><strong>E-mail de Contato e Exclusão:</strong> saulos.joseph@gmail.com</span>
              <span><strong>Prazo de Atendimento:</strong> Em até 15 dias corridos conforme determina a LGPD.</span>
            </div>
          </section>

          <div className="border-t-4 border-[#18181B] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/#cadastro"
              className="w-full sm:w-auto bg-[#B91C1C] text-white font-poster text-lg px-6 py-3 uppercase border-2 border-[#18181B] shadow-poster hover:bg-[#991B1B] text-center"
            >
              Ir para o Formulário de Inscrição
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto bg-[#18181B] text-[#FEF08A] font-poster text-lg px-6 py-3 uppercase border-2 border-[#18181B] shadow-poster hover:bg-[#27272A] text-center"
            >
              Voltar ao Início
            </Link>
          </div>
        </article>
      </main>

      {/* RODAPÉ */}
      <footer className="w-full bg-[#18181B] text-[#FAF4E6] border-t-4 border-[#18181B] py-6 px-4 text-center text-xs text-zinc-400">
        Quero Ser Brigadista Comunitário &bull; Em Defesa da Vida, da Floresta e da Proteção de Dados Pessoais
      </footer>
    </div>
  );
}
