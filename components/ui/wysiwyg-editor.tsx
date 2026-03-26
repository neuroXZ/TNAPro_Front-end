"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Unlink,
  Palette,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WysiwygEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function WysiwygEditor({
  value,
  onChange,
  placeholder = "Enter content...",
  className = "",
}: WysiwygEditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        inline: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[150px] p-3',
        placeholder,
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  // Color options
  const colors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB',
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#10B981'
  ]

  // Link handlers
  const handleAddLink = () => {
    if (!editor) return

    const selection = editor.state.selection
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to)

    if (selectedText) {
      setShowLinkDialog(true)
      setLinkUrl('')
    } else {
      alert('Please select text first to add a link')
    }
  }

  const handleSetLink = () => {
    if (!editor) return

    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run()
    }
    setShowLinkDialog(false)
    setLinkUrl('')
  }

  const handleRemoveLink = () => {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
  }

  // Color handlers
  const handleColorSelect = (color: string) => {
    if (!editor) return
    editor.chain().focus().setColor(color).run()
    setShowColorPicker(false)
  }

  if (!isMounted || !editor) {
    return <div className="h-32 animate-pulse bg-muted rounded-md" />
  }

  return (
    <div className={cn("border rounded-md focus-within:ring-2 focus-within:ring-ring", className)}>
      {/* Toolbar */}
      <div className="border-b p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-accent' : ''}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Link buttons */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddLink}
          className={editor.isActive('link') ? 'bg-accent' : ''}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemoveLink}
          disabled={!editor.isActive('link')}
        >
          <Unlink className="h-4 w-4" />
        </Button>

        {/* Color picker */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
          >
            <Palette className="h-4 w-4" />
          </Button>

          {showColorPicker && (
            <div className="w-[150px] absolute top-full left-0 mt-1 p-2 bg-popover border rounded-md shadow-md z-10">
              <div className="grid grid-cols-5 gap-1">
                {colors.map((color) => (
                  <Button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded-sm border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="p-3 border-b bg-muted">
          <div className="flex gap-2 items-center">
            <input
              type="url"
              placeholder="Enter URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 px-3 py-1 border rounded-md text-sm"
              autoFocus
            />
            <Button type="button" size="sm" onClick={handleSetLink}>
              Add Link
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowLinkDialog(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="max-h-[200px] overflow-y-auto">
        <EditorContent
          editor={editor}
          className="prose-mail-body min-h-[150px] max-w-none"
        />
      </div>
    </div>
  )
}