import React from "react";
import { Button } from "./ui/button";
import { Eye } from "lucide-react";
import TrendingNow from "./TrendingNow";
import { useLanguage } from "@/src/i18n/LanguageContext";

const RightSideBar = () => {
  const { t } = useLanguage();
  return (
    <aside className="w-72 lg:w-80 p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="space-y-4 lg:space-y-6">
        <TrendingNow />

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 lg:p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm lg:text-base">
            {t("rightbar.blogTitle")}
          </h3>
          <ul className="space-y-2 text-xs lg:text-sm">
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">✏️</span>
              <span className="text-gray-700">{t("rightbar.blog1")}</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">✏️</span>
              <span className="text-gray-700">{t("rightbar.blog2")}</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded p-3 lg:p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm lg:text-base">
            {t("rightbar.metaTitle")}
          </h3>
          <ul className="space-y-2 text-xs lg:text-sm">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">💬</span>
              <span className="text-gray-700">{t("rightbar.meta1")}</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">💬</span>
              <span className="text-gray-700">{t("rightbar.meta2")}</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">📋</span>
              <span className="text-gray-700">{t("rightbar.meta3")}</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-3 text-sm lg:text-base">
            {t("rightbar.filtersTitle")}
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent text-xs lg:text-sm"
          >
            {t("rightbar.createFilter")}
          </Button>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-3 text-sm lg:text-base">
            {t("rightbar.watchedTitle")}
          </h3>
          <div className="flex items-center justify-center py-6 lg:py-8">
            <div className="text-center">
              <Eye className="w-10 h-10 lg:w-12 lg:h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-xs lg:text-sm text-gray-500 mb-3">
                {t("rightbar.watchedHint")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent text-xs lg:text-sm"
              >
                👁️ {t("rightbar.watchTag")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSideBar;