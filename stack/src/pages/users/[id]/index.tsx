import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import Mainlayout from "@/src/layout/Mainlayout";
import { useAuth } from "@/src/lib/AuthContext";
import axiosInstance from "@/src/lib/axiosinstance";
import SessionList from "@/src/components/SessionList";
import { Calendar, Edit, Plus, X } from "lucide-react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ReputationActivity from "@/src/components/ReputationActivity";
import ReputationTransfer from "@/src/components/ReputationTransfer";
import FollowStats from "@/src/components/FollowStats";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import { apiErrorMessage } from "@/src/i18n/runtime";

const index = () => {
  const { user, ChangePassword } = useAuth();
  const { t } = useLanguage();
  const { date, number } = useFormatters();
  const router = useRouter();
  const { id } = router.query;
  const [users, setusers] = useState<any>(null);
  const [loading, setloading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: users?.name || "",
    username: users?.username || "",
    about: users?.about || "",
    tags: users?.tags || [],
  });
  const [newTag, setNewTag] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const fetchuser = async () => {
      try {
        const res = await axiosInstance.get("/user/getalluser");
        const matcheduser = res.data.data.find((u: any) => u._id === id);
        setusers(matcheduser);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchuser();
  }, [id]);
  useEffect(() => {
    if (users) {
      setEditForm({
        name: users.name || "",
        username: users.username || "",
        about: users.about || "",
        tags: users.tags || [],
      });
    }
  }, [users]);

  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </Mainlayout>
    );
  }
  if (!users || users.length === 0) {
    return (
      <Mainlayout>
        <div className="text-center text-gray-500 mt-4">
          {t("profile.notFound")}
        </div>
      </Mainlayout>
    );
  }

  const handleSaveProfile = async () => {
    try {
      const res = await axiosInstance.patch(`/user/update/${user?._id}`, {
        editForm,
      });
      if (res.data.data) {
        const updatedUser = {
          ...users,
          name: editForm.name,
          username: res.data.data.username,
          about: editForm.about,
          tags: editForm.tags,
        };

        setusers(updatedUser);
        setIsEditing(false);
        toast.success(t("profile.updated"));
      }
    } catch (error: any) {
      console.log(error);
      toast.error(apiErrorMessage(error));
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !editForm.tags.includes(trimmedTag)) {
      setEditForm({ ...editForm, tags: [...editForm.tags, trimmedTag] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm({
      ...editForm,
      tags: editForm.tags.filter((tag: any) => tag !== tagToRemove),
    });
  };
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      toast.error(t("profile.bothFieldsRequired"));
      return;
    }
    await ChangePassword({ oldPassword, newPassword });
    setOldPassword("");
    setNewPassword("");
  };

  const currentUserId = user?._id;
  const isOwnProfile = id === currentUserId;
  return (
    <Mainlayout>
      <div className="max-w-6xl">
        {/* User Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 mb-8">
          <Avatar className="w-24 h-24 lg:w-32 lg:h-32">
            <AvatarFallback className="text-2xl lg:text-3xl">
              {users.name
                .split(" ")
                .map((n: any) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">
                  {users.name}
                </h1>
                {users.username && (
                  <p className="text-sm text-gray-500">@{users.username}</p>
                )}
              </div>

              {isOwnProfile && (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <Edit className="w-4 h-4" />
                      {t("profile.editButton")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
                    <DialogHeader>
                      <DialogTitle>{t("profile.editTitle")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          {t("profile.basicInfo")}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">
                              {t("profile.displayName")}
                            </Label>
                            <Input
                              id="name"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              placeholder={t("profile.displayNamePlaceholder")}
                            />
                          </div>
                          <div>
                            <Label htmlFor="username">
                              {t("profile.username")}
                            </Label>
                            <Input
                              id="username"
                              value={editForm.username}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  username: e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9_]/g, ""),
                                })
                              }
                              placeholder={t("profile.usernamePlaceholder")}
                              maxLength={20}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {t("profile.usernameHint")}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* About Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          {t("profile.aboutHeading")}
                        </h3>
                        <div>
                          <Label htmlFor="about">{t("profile.aboutMe")}</Label>
                          <Textarea
                            id="about"
                            value={editForm.about}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                about: e.target.value,
                              })
                            }
                            placeholder={t("profile.aboutPlaceholder")}
                            className="min-h-32"
                          />
                        </div>
                      </div>

                      {/* Tags/Skills Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          {t("profile.skillsHeading")}
                        </h3>

                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder={t("profile.addSkillPlaceholder")}
                              onKeyPress={(e) =>
                                e.key === "Enter" && handleAddTag()
                              }
                            />
                            <Button
                              onClick={handleAddTag}
                              variant="outline"
                              size="sm"
                              className="bg-orange-600 text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {editForm.tags.map((tag: any) => {
                              return (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="bg-orange-100 text-orange-800 flex items-center gap-1"
                                >
                                  {tag}
                                  <button
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
                      </div>

                      {/* Change Password Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          {t("profile.changePassword")}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="oldPassword">
                              {t("profile.currentPassword")}
                            </Label>
                            <Input
                              id="oldPassword"
                              type="password"
                              value={oldPassword}
                              onChange={(e) => setOldPassword(e.target.value)}
                              placeholder={t("profile.currentPasswordPlaceholder")}
                            />
                          </div>
                          <div>
                            <Label htmlFor="newPassword">
                              {t("profile.newPassword")}
                            </Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder={t("profile.newPasswordPlaceholder")}
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleChangePassword}
                          variant="outline"
                          className="bg-orange-600 text-white"
                        >
                          {t("profile.updatePassword")}
                        </Button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="bg-white text-gray-800 hover:text-gray-900"
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {t("profile.saveChanges")}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {t("profile.memberSince", { date: date(users.joinDate) })}
              </div>
              <FollowStats userId={users._id} isOwnProfile={isOwnProfile} />
            </div>
            <div className="flex flex-wrap items-center space-x-6 text-sm">
              <div className="flex items-center">
                <span className="font-semibold text-lg text-blue-700">
                  {number(users.reputation ?? 0)}
                </span>
                <span className="text-gray-600 ml-1">
                  {t("profile.reputation")}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="font-semibold">5</span>
                <span className="text-gray-600 ml-1">
                  {t("profile.goldBadges")}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                <span className="font-semibold">23</span>
                <span className="text-gray-600 ml-1">
                  {t("profile.silverBadges")}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-600 rounded-full mr-2"></div>
                <span className="font-semibold">45</span>
                <span className="text-gray-600 ml-1">
                  {t("profile.bronzeBadges")}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1  gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.aboutHeading")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {users.about}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.topTags")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.tags.map((tag: string) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                        >
                          {tag}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {isOwnProfile && <SessionList />}
            <ReputationActivity userId={users._id} />
            {isOwnProfile && <ReputationTransfer />}
          </div>
        </div>
      </div>
    </Mainlayout>
  );
};

export default index;