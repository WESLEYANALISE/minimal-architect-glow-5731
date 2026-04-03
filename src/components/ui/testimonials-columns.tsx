import { motion } from 'framer-motion';
import React from 'react';

const SparklineDivider = () =>
<div className="relative mx-auto w-[60%] mb-10">
    <div className="h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
    













  </div>;

import {
  Brain,
  BookOpen,
  Scale,
  FileText,
  Headphones,
  Sparkles,
  GraduationCap,
  ClipboardList,
  MessageSquare,
  Library,
  Layers,
  Zap } from
'lucide-react';

type FeatureCard = {
  icon: React.ElementType;
  title: string;
  benefit: string;
  tag: string;
};

const features: FeatureCard[] = [
{
  icon: Brain,
  title: 'Professora IA 24h',
  benefit: 'Tire dúvidas a qualquer hora sem julgamentos e receba explicações no seu ritmo.',
  tag: 'Inteligência Artificial'
},
{
  icon: Scale,
  title: 'Vade Mecum Comentado',
  benefit: 'Todos os artigos com explicação simples, exemplos práticos e linguagem humana.',
  tag: 'Legislação'
},
{
  icon: Layers,
  title: 'Flashcards Inteligentes',
  benefit: 'Memorize o que realmente cai nas provas com repetição espaçada e método ativo.',
  tag: 'Memorização'
},
{
  icon: GraduationCap,
  title: 'Simulados OAB',
  benefit: 'Questões da 1ª e 2ª fase com gabarito comentado. Treine como na prova real.',
  tag: 'OAB'
},
{
  icon: Headphones,
  title: 'Resumos em Áudio',
  benefit: 'Estude no ônibus, academia ou onde quiser. Conteúdo completo em formato podcast.',
  tag: 'Áudio'
},
{
  icon: Library,
  title: 'Biblioteca Jurídica',
  benefit: '+1.200 livros, doutrinas e súmulas organizados por área. Tudo em um só lugar.',
  tag: 'Conteúdo'
},
{
  icon: ClipboardList,
  title: 'Plano de Estudos',
  benefit: 'Cronograma personalizado para zerar as matérias antes das provas e não pegar DP.',
  tag: 'Organização'
},
{
  icon: MessageSquare,
  title: 'Aulas Interativas',
  benefit: 'Módulos com texto, áudio e questões integradas para fixar o conteúdo de vez.',
  tag: 'Aulas'
},
{
  icon: FileText,
  title: 'Mapas Mentais',
  benefit: 'Visualize estruturas complexas de forma simples e acelere sua compreensão.',
  tag: 'Resumos'
},
{
  icon: Sparkles,
  title: 'Explicação Simplificada',
  benefit: 'Qualquer artigo explicado de forma objetiva, sem juridiquês desnecessário.',
  tag: 'Didática'
},
{
  icon: Zap,
  title: 'Modo Revisão Rápida',
  benefit: 'Relembre tópicos essenciais em minutos com fichas de revisão ultra-compactas.',
  tag: 'Revisão'
},
{
  icon: BookOpen,
  title: 'Leis Comentadas',
  benefit: 'Constituição, Código Civil, Penal e muito mais com comentários doutrinários.',
  tag: 'Legislação'
}];


const firstColumn = features.slice(0, 4);
const secondColumn = features.slice(4, 8);
const thirdColumn = features.slice(8, 12);

const FeatureCard = ({ icon: Icon, title, benefit, tag }: FeatureCard) =>
<div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
    <div className="flex items-start gap-3">
      <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
      style={{ background: 'rgba(212,168,75,0.15)', border: '1px solid rgba(212,168,75,0.3)' }}>

        <Icon className="w-4 h-4" style={{ color: '#d4a84b' }} />
      </div>
      <div className="min-w-0">
        <span
        className="inline-block text-[9px] uppercase tracking-widest mb-1 font-semibold"
        style={{ color: 'rgba(212,168,75,0.7)' }}>

          {tag}
        </span>
        <p className="text-white text-[13px] font-semibold leading-tight mb-1">{title}</p>
        <p className="text-white/50 text-[11px] leading-relaxed">{benefit}</p>
      </div>
    </div>
  </div>;


const FeaturesColumn = ({
  items,
  duration,
  reverse = false




}: {items: FeatureCard[];duration: number;reverse?: boolean;}) =>
<div className="flex flex-col overflow-hidden flex-1" style={{ height: 420 }}>
    <motion.div
    animate={{ translateY: reverse ? ['0%', '-50%'] : ['-50%', '0%'] }}
    transition={{ duration, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
    className="flex flex-col">

      {[...items, ...items].map((f, i) =>
    <FeatureCard key={i} {...f} />
    )}
    </motion.div>
  </div>;


export const TestimonialsSection = () =>
<section className="bg-black w-full pt-4 pb-12 px-5">
    <SparklineDivider />
    <p
    className="text-center text-white/50 text-xs uppercase tracking-widest mb-2"
    style={{ fontFamily: 'Georgia, serif' }}>

      Funcionalidades
    </p>
    <h2
    className="text-center text-white text-2xl font-bold mb-8 leading-tight"
    style={{ fontFamily: 'Georgia, serif' }}>

      Tudo o que você precisa para seus estudos
    </h2>

    <div
    className="relative overflow-hidden"
    style={{
      maskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)'
    }}>

      {/* Mobile: 2 colunas */}
      <div className="flex gap-3 md:hidden">
        <FeaturesColumn items={firstColumn} duration={28} reverse={false} />
        <FeaturesColumn items={secondColumn} duration={34} reverse={true} />
      </div>
      {/* Desktop: 3 colunas */}
      <div className="hidden md:flex gap-3">
        <FeaturesColumn items={firstColumn} duration={28} reverse={false} />
        <FeaturesColumn items={secondColumn} duration={34} reverse={true} />
        <FeaturesColumn items={thirdColumn} duration={25} reverse={false} />
      </div>
    </div>
  </section>;