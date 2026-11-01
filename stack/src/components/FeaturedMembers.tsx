import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { effectivePlan } from "@/src/lib/plans";
import { useLanguage } from "@/src/i18n/LanguageContext";

interface Member {
  _id: string;
  name: string;
  username?: string;
}

export default function FeaturedMembers() {
  const { t } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // plain axios on purpose: anonymous, so this can never trigger the login redirect
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/getalluser`);
        if (cancelled) return;
        const gold = (res.data.data as any[])
          .filter((user) => effectivePlan(user.plan, user.planExpiresAt) === "gold")
          .slice(0, 5);
        setMembers(gold);
      } catch (error) {
        console.log(error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // nobody is on Gold right now: no empty card
  if (members.length === 0) return null;

  return (
    <div className="rounded-xl border border-yellow-300 bg-gradient-to-br from-yellow-50 to-white p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-amber-900">
        <Crown className="h-4 w-4 text-yellow-600" />
        {t("users.featured")}
      </h3>
      <ul className="space-y-1">
        {members.map((member) => (
          <li key={member._id}>
            <Link
              href={`/users/${member._id}`}
              className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-yellow-100/60"
            >
              <Avatar className="h-8 w-8 ring-2 ring-yellow-400">
                <AvatarFallback className="text-xs">{member.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{member.name}</p>
                {member.username && (
                  <p className="truncate text-xs text-gray-500">@{member.username}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}