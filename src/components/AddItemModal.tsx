"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createMove,
  createActivityAndMove,
  searchActivities,
  type Activity,
} from "@/lib/actions";
import { Search, Plus, Clock } from "lucide-react";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const [step, setStep] = useState<"search" | "create">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Activity[]>([]);
  // const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
  //   null
  // );
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // NOTE: 새 활동 생성 폼 상태
  const [newActivity, setNewActivity] = useState({
    title: "",
    category: "",
    description: "",
  });

  // NOTE: 검색 실행
  const handleSearch = async (query: string) => {
    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchActivities(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // NOTE: 검색어 변경 시 디바운싱
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // NOTE: 기존 활동 선택
  const handleSelectActivity = async (activity: Activity) => {
    setIsLoading(true);
    try {
      const result = await createMove(activity.id);
      if (result.success) {
        onClose();
        resetForm();
      } else {
        alert(result.error || "Move 기록에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to create move:", error);
      alert("Move 기록 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // NOTE: 새 활동 생성
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", newActivity.title);
      formData.append("category", newActivity.category);
      formData.append("description", newActivity.description);

      const result = await createActivityAndMove(formData);
      if (result.success) {
        onClose();
        resetForm();
      } else {
        alert(result.error || "활동 생성에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to create activity:", error);
      alert("활동 생성 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // NOTE: 폼 초기화
  const resetForm = () => {
    setStep("search");
    setSearchQuery("");
    setSearchResults([]);
    // setSelectedActivity(null);
    setNewActivity({ title: "", category: "", description: "" });
  };

  // NOTE: 모달 닫힐 때 폼 초기화
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "search" ? "활동 선택 또는 추가" : "새 활동 만들기"}
          </DialogTitle>
        </DialogHeader>

        {step === "search" ? (
          <div className="space-y-4">
            {/* 검색 입력 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="활동 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}
            </div>

            {/* 검색 결과 */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700">기존 활동</h4>
                {searchResults.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSelectActivity(activity)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">
                          {activity.title}
                        </h5>
                        {activity.category && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {activity.category}
                          </Badge>
                        )}
                        {activity.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 새 활동 만들기 버튼 */}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep("create");
                  setNewActivity((prev) => ({ ...prev, title: searchQuery }));
                }}
              >
                <Plus className="h-4 w-4 mr-2" />새 활동 만들기
                {searchQuery && (
                  <span className="ml-2 text-xs text-gray-500">
                    &quot;{searchQuery}&quot;
                  </span>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* 새 활동 생성 폼 */
          <form onSubmit={handleCreateActivity} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                활동명 <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                value={newActivity.title}
                onChange={(e) =>
                  setNewActivity((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="예: 운동하기, 책 읽기"
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium mb-1"
              >
                카테고리
              </label>
              <Input
                id="category"
                value={newActivity.category}
                onChange={(e) =>
                  setNewActivity((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="예: 건강, 학습, 생활"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-1"
              >
                설명
              </label>
              <Input
                id="description"
                value={newActivity.description}
                onChange={(e) =>
                  setNewActivity((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="활동에 대한 간단한 설명"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("search")}
                className="flex-1"
              >
                뒤로
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !newActivity.title.trim()}
                className="flex-1"
              >
                {isLoading ? "생성 중..." : "생성하고 기록"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
