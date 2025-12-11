import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  content: string;
  size: string;
  uploadDate: string;
}

interface SearchResult {
  documentName: string;
  snippet: string;
  relevance: number;
}

const Index = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [aiAnswer, setAiAnswer] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const preventCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast({
        title: "Копирование запрещено",
        description: "Документы защищены от копирования",
        variant: "destructive",
      });
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const preventScreenshot = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key === 'S') ||
        (e.metaKey && e.shiftKey && e.key === '3') ||
        (e.metaKey && e.shiftKey && e.key === '4') ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        toast({
          title: "Действие заблокировано",
          description: "Скриншоты документов запрещены",
          variant: "destructive",
        });
      }
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventScreenshot);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCopy);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventScreenshot);
    };
  }, [toast]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newDocuments: Document[] = [];
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const doc: Document = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          content: content,
          size: (file.size / 1024).toFixed(2) + " KB",
          uploadDate: new Date().toLocaleDateString("ru-RU"),
        };
        newDocuments.push(doc);
        
        if (newDocuments.length === files.length) {
          setDocuments((prev) => [...prev, ...newDocuments]);
          toast({
            title: "Документы загружены",
            description: `Успешно загружено ${files.length} файл(ов)`,
          });
        }
      };
      reader.readAsText(file);
    });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Введите запрос",
        description: "Пожалуйста, введите текст для поиска",
        variant: "destructive",
      });
      return;
    }

    if (documents.length === 0) {
      toast({
        title: "Нет документов",
        description: "Загрузите документы для поиска",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    setTimeout(() => {
      const results: SearchResult[] = [];
      const queryLower = searchQuery.toLowerCase();

      documents.forEach((doc) => {
        const contentLower = doc.content.toLowerCase();
        const index = contentLower.indexOf(queryLower);

        if (index !== -1) {
          const start = Math.max(0, index - 50);
          const end = Math.min(doc.content.length, index + queryLower.length + 50);
          const snippet = "..." + doc.content.slice(start, end) + "...";
          
          results.push({
            documentName: doc.name,
            snippet: snippet,
            relevance: 0.9,
          });
        }
      });

      setSearchResults(results);

      if (results.length > 0) {
        const answer = `На основе анализа ${results.length} найденных фрагментов в ваших документах: ${results[0].snippet}`;
        setAiAnswer(answer);
      } else {
        setAiAnswer("По вашему запросу ничего не найдено в загруженных документах.");
      }

      setIsSearching(false);
    }, 1000);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    toast({
      title: "Документ удалён",
      description: "Документ успешно удалён из коллекции",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 select-none">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-3">
            <Icon name="FileSearch" size={40} className="text-primary" />
            Умный Поиск
          </h1>
          <p className="text-slate-600">Загрузите документы и найдите нужную информацию мгновенно</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2 animate-scale-in">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Icon name="Search" size={24} className="text-primary" />
                Поиск
              </h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Введите ваш вопрос..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isSearching} className="min-w-[100px]">
                  {isSearching ? (
                    <Icon name="Loader2" size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Icon name="Search" size={20} className="mr-2" />
                      Искать
                    </>
                  )}
                </Button>
              </div>
            </div>

            {aiAnswer && (
              <Card className="bg-blue-50 border-blue-200 p-4 mb-6 animate-fade-in">
                <div className="flex items-start gap-3">
                  <Icon name="Sparkles" size={24} className="text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Ответ</h3>
                    <p className="text-slate-700 leading-relaxed select-text">{aiAnswer}</p>
                  </div>
                </div>
              </Card>
            )}

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Icon name="ListFilter" size={20} />
                Результаты ({searchResults.length})
              </h3>
              <ScrollArea className="h-[400px] pr-4">
                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((result, index) => (
                      <Card key={index} className="p-4 hover:shadow-md transition-shadow animate-fade-in">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-slate-900 flex items-center gap-2">
                            <Icon name="FileText" size={16} className="text-primary" />
                            {result.documentName}
                          </span>
                          <Badge variant="secondary">{Math.round(result.relevance * 100)}%</Badge>
                        </div>
                        <p className="text-sm text-slate-600 select-text">{result.snippet}</p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Icon name="SearchX" size={48} className="mb-2" />
                    <p>Результаты поиска появятся здесь</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </Card>

          <Card className="p-6 animate-scale-in">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Icon name="FolderOpen" size={24} className="text-primary" />
              Документы
            </h2>

            <label htmlFor="file-upload">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-all mb-4">
                <Icon name="Upload" size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600 mb-1">Перетащите файлы сюда</p>
                <p className="text-xs text-slate-400">или нажмите для выбора</p>
              </div>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <ScrollArea className="h-[500px] pr-4">
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 truncate flex items-center gap-2">
                            <Icon name="FileText" size={16} className="text-primary" />
                            {doc.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">{doc.size}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{doc.uploadDate}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="ml-2"
                        >
                          <Icon name="Trash2" size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Icon name="FolderX" size={48} className="mb-2" />
                  <p className="text-center">Нет загруженных документов</p>
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;