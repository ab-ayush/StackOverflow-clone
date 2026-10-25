import { useState, useRef, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { CodeSnippet, PostInput, PostType } from "@/src/lib/useFeed";
import { imageUrl } from "@/src/lib/imageUrl";
import { useLanguage } from "@/src/i18n/LanguageContext";

const MAX_CONTENT = 2000;
const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface PendingImage {
  file: File;
  preview: string;
}

interface PostComposerProps {
  initial?: {
    content: string;
    type: PostType;
    codeSnippet: CodeSnippet | null;
    images: string[];
  };
  submitLabel?: string;
  onSubmit: (input: PostInput) => Promise<boolean>;
  onCancel?: () => void;
}

export default function PostComposer({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: PostComposerProps) {
  const { t } = useLanguage();
  const [content, setContent] = useState(initial?.content || "");
  const [type, setType] = useState<PostType>(initial?.type || "update");
  const [showCode, setShowCode] = useState(!!initial?.codeSnippet);
  const [language, setLanguage] = useState(initial?.codeSnippet?.language || "javascript");
  const [code, setCode] = useState(initial?.codeSnippet?.code || "");
  const [existingImages, setExistingImages] = useState<string[]>(initial?.images || []);
  const [newImages, setNewImages] = useState<PendingImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // free the temporary preview URLs when the composer goes away
  const pendingRef = useRef<PendingImage[]>([]);
  pendingRef.current = newImages;
  useEffect(() => {
    return () => pendingRef.current.forEach((i) => URL.revokeObjectURL(i.preview));
  }, []);

  const totalImages = existingImages.length + newImages.length;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // lets the same file be picked again later
    const accepted: PendingImage[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(t("composer.imageType", { name: file.name }));
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(t("composer.imageTooBig", { name: file.name }));
        continue;
      }
      if (totalImages + accepted.length >= MAX_IMAGES) {
        toast.error(t("composer.imageLimit", { max: MAX_IMAGES }));
        break;
      }
      accepted.push({ file, preview: URL.createObjectURL(file) });
    }
    if (accepted.length) setNewImages((prev) => [...prev, ...accepted]);
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    const success = await onSubmit({
      content,
      type,
      codeSnippet: showCode && code.trim() ? { language, code } : null,
      newImages: newImages.map((i) => i.file),
      keepImages: initial ? existingImages : undefined,
    });
    setSubmitting(false);
    if (success && !initial) {
      setContent("");
      setType("update");
      setShowCode(false);
      setCode("");
      newImages.forEach((i) => URL.revokeObjectURL(i.preview));
      setNewImages([]);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("composer.placeholder")}
          maxLength={MAX_CONTENT}
          className="min-h-24 resize-none text-gray-900"
        />

        {showCode && (
          <div className="space-y-2">
            <Input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder={t("composer.codeLanguagePlaceholder")}
              className="text-gray-900"
            />
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("composer.codePlaceholder")}
              className="min-h-32 font-mono text-sm resize-none text-gray-900"
            />
          </div>
        )}

        {totalImages > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {existingImages.map((path) => (
              <div key={path} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl(path)}
                  alt={t("composer.imageAlt")}
                  className="w-full h-full object-cover rounded-md border"
                />
                <button
                  type="button"
                  aria-label={t("composer.removeImage")}
                  onClick={() =>
                    setExistingImages((prev) => prev.filter((p) => p !== path))
                  }
                  className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {newImages.map((img, index) => (
              <div key={img.preview} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
                  alt={t("composer.imageAlt")}
                  className="w-full h-full object-cover rounded-md border"
                />
                <button
                  type="button"
                  aria-label={t("composer.removeImage")}
                  onClick={() => removeNewImage(index)}
                  className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleFiles}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PostType)}
              className="border rounded-md px-2 py-1 text-sm bg-white text-gray-900"
            >
              <option value="update">{t("composer.type.update")}</option>
              <option value="snippet">{t("composer.type.snippet")}</option>
              <option value="showcase">{t("composer.type.showcase")}</option>
              <option value="achievement">{t("composer.type.achievement")}</option>
            </select>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCode((v) => !v)}
              className="text-gray-600"
            >
              {showCode ? t("composer.removeCode") : t("composer.addCode")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={totalImages >= MAX_IMAGES}
              className="text-gray-600"
            >
              <ImagePlus className="w-4 h-4 mr-1" />
              {t("composer.images", { count: totalImages, max: MAX_IMAGES })}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {content.length}/{MAX_CONTENT}
            </span>
            {onCancel && (
              <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                {t("common.cancel")}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? t("composer.saving") : submitLabel ?? t("composer.post")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}