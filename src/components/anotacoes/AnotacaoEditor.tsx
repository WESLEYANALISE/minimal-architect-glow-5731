import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Highlighter, Star, X, Check, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { CATEGORIAS_ANOTACOES, getCategoriaColor, getCategoriaCurta } from '@/lib/anotacoesCategorias';

const CORES_NOTA = [
  { name: 'Amarelo', value: '#FEF7CD' },
  { name: 'Verde', value: '#D3E4FD' },
  { name: 'Rosa', value: '#FFDEE2' },
  { name: 'Roxo', value: '#E5DEFF' },
  { name: 'Laranja', value: '#FDE1D3' },
];

interface AnotacaoEditorProps {
  initialTitulo?: string;
  initialConteudo?: string;
  initialCor?: string;
  initialImportante?: boolean;
  initialDataReferencia?: string;
  initialCategoria?: string | null;
  onSave: (data: { titulo: string; conteudo: string; cor: string; importante: boolean; data_referencia: string; categoria: string | null }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export const AnotacaoEditor = ({
  initialTitulo = '',
  initialConteudo = '',
  initialCor = '#FEF7CD',
  initialImportante = false,
  initialDataReferencia,
  initialCategoria = null,
  onSave,
  onCancel,
  isSaving = false,
}: AnotacaoEditorProps) => {
  const [titulo, setTitulo] = useState(initialTitulo);
  const [cor, setCor] = useState(initialCor);
  const [importante, setImportante] = useState(initialImportante);
  const [dataRef, setDataRef] = useState(initialDataReferencia || new Date().toISOString().split('T')[0]);
  const [showCores, setShowCores] = useState(false);
  const [categoria, setCategoria] = useState<string | null>(initialCategoria);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: 'Escreva sua anotação...' }),
    ],
    content: initialConteudo,
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none min-h-[120px] focus:outline-none p-3 text-white/90',
      },
    },
  });

  const handleSave = () => {
    if (!titulo.trim() && !editor?.getHTML().replace(/<[^>]*>/g, '').trim()) return;
    onSave({
      titulo: titulo.trim() || 'Sem título',
      conteudo: editor?.getHTML() || '',
      cor,
      importante,
      data_referencia: dataRef,
      categoria,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5 text-white/70" />
        </button>
        <h3 className="text-sm font-semibold text-white">
          {initialTitulo ? 'Editar Anotação' : 'Nova Anotação'}
        </h3>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Options row */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
        <input
          type="date"
          value={dataRef}
          onChange={(e) => setDataRef(e.target.value)}
          className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-amber-500/50"
        />
        <button
          onClick={() => setImportante(!importante)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            importante ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' : 'bg-white/10 text-white/60 border border-white/10'
          }`}
        >
          <Star className={`w-3 h-3 ${importante ? 'fill-amber-400' : ''}`} />
          Importante
        </button>
        <div className="relative">
          <button
            onClick={() => setShowCores(!showCores)}
            className="p-1.5 rounded-full border border-white/10 hover:bg-white/10 transition-colors"
            style={{ backgroundColor: cor + '40' }}
          >
            <Palette className="w-3.5 h-3.5 text-white/70" />
          </button>
          {showCores && (
            <div className="absolute top-full mt-1 left-0 z-10 flex gap-1 bg-neutral-800 rounded-lg p-2 border border-white/10 shadow-xl">
              {CORES_NOTA.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setCor(c.value); setShowCores(false); }}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${cor === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Categoria chips */}
      <div className="px-4 py-2 border-b border-white/10 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[10px] text-white/40 mr-1">Área:</span>
          <button
            onClick={() => setCategoria(null)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap ${
              !categoria ? 'bg-white/20 text-white border border-white/30' : 'bg-white/5 text-white/50 border border-white/10'
            }`}
          >
            Nenhuma
          </button>
          {CATEGORIAS_ANOTACOES.map((cat) => {
            const color = getCategoriaColor(cat);
            const selected = categoria === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoria(selected ? null : cat)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap border ${
                  selected ? 'text-white' : 'text-white/60'
                }`}
                style={{
                  backgroundColor: selected ? color + '30' : 'transparent',
                  borderColor: selected ? color + '60' : 'rgba(255,255,255,0.1)',
                }}
              >
                {getCategoriaCurta(cat)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título da anotação..."
        className="bg-transparent text-white text-lg font-bold px-4 pt-4 pb-2 focus:outline-none placeholder:text-white/30"
      />

      {/* Toolbar */}
      {editor && (
        <div className="flex items-center gap-1 px-4 pb-2 border-b border-white/5">
          <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarBtn>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="w-4 h-4" />
          </ToolbarBtn>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <ToolbarBtn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: '#FEF08A' }).run()}>
            <Highlighter className="w-4 h-4" />
          </ToolbarBtn>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </motion.div>
  );
};

const ToolbarBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg transition-colors ${active ? 'bg-amber-500/30 text-amber-300' : 'text-white/50 hover:text-white/80 hover:bg-white/10'}`}
  >
    {children}
  </button>
);
