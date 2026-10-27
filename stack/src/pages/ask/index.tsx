import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import Mainlayout from "@/src/layout/Mainlayout";
import { useAuth } from "@/src/lib/AuthContext";
import axiosInstance from "@/src/lib/axiosinstance";
import { useUsage } from "@/src/lib/useUsage";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import { apiErrorMessage } from "@/src/i18n/runtime";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { toast } from "react-toastify";

const index = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { number } = useFormatters();
  const { usage, refresh: refreshUsage } = useUsage(!!user);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");

  const used = usage?.questions.used ?? 0;
  const limit = usage ? usage.questions.limit : null; // null = unlimited
  const limitReached = !!usage && limit !== null && used >= limit;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    if (id === "tags") {
      const tagarray = value
        .split(/[s,]+/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      setFormData((prev) => ({ ...prev, tags: tagarray }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t("ask.loginRequired"));
      router.push("/auth");
      return;
    }
    if (limitReached) return;

    try {
      const res = await axiosInstance.post("/question/ask", {
        postquestiondata: {
          questiontitle: formData.title,
          questionbody: formData.body,
          questiontags: formData.tags,
        },
      });
      if (res.data.data) {
        toast.success(t("ask.posted"));
        router.push("/");
      }
    } catch (error: any) {
      console.log(error);
      if (error?.response?.data?.code === "QUESTION_LIMIT") {
        // clicking the message opens the plans page
        toast.error(t("limits.questionReached"), {
          onClick: () => router.push("/pricing"),
        });
        refreshUsage();
      } else {
        toast.error(apiErrorMessage(error));
      }
    }
  };

  const handleAddTag = (e: any) => {
    e.preventDefault();
    const trimmedTag = newTag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmedTag] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag: any) => tag !== tagToRemove),
    });
  };

  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl lg:text-2xl font-semibold mb-6">
          {t("ask.heading")}
        </h1>

        {usage && (
          <div
            className={`mb-4 rounded-md border px-4 py-3 text-sm ${
              limitReached
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {limitReached
                  ? t("limits.questionReached")
                  : limit === null
                  ? t("limits.questionMeterUnlimited")
                  : t("limits.questionMeter", {
                      used: number(used),
                      limit: number(limit),
                    })}
              </span>
              {limit !== null && (
                <Link href="/pricing" className="font-medium underline">
                  {t("limits.upgradeCta")}
                </Link>
              )}
            </div>
            {limit !== null && (
              <p className="mt-1 text-xs opacity-80">{t("limits.resets")}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">
                {t("ask.cardTitle")}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-base font-semibold">
                  {t("ask.titleLabel")}
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  {t("ask.titleHint")}
                </p>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={t("ask.titlePlaceholder")}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="body" className="text-base font-semibold">
                  {t("ask.bodyLabel")}
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  {t("ask.bodyHint")}
                </p>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={handleChange}
                  placeholder={t("ask.bodyPlaceholder")}
                  className="min-h-32 lg:min-h-48 w-full"
                />
              </div>
              <div>
                <Label htmlFor="tags" className="text-base font-semibold">
                  {t("ask.tagsLabel")}
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  {t("ask.tagsHint")}
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder={t("ask.tagsPlaceholder")}
                    className="w-full"
                  />
                  <Button
                    onClick={handleAddTag}
                    variant="outline"
                    size="sm"
                    type="button"
                    className="bg-orange-600 text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag: any) => {
                    return (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-orange-100 text-orange-800 flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Button
                  type="submit"
                  disabled={limitReached}
                  className="bg-blue-600 text-white"
                >
                  {t("ask.review")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </Mainlayout>
  );
};

export default index;