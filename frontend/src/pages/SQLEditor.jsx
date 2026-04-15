import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, ClientSideRowModelModule, CsvExportModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  Play,
  Download,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Table,
  FileCode,
  Trash2,
  X,
  BookOpen,
  Lightbulb,
  Database,
  ChevronRight,
  Tag,
  Award,
  Eye,
  EyeOff,
  FileQuestion,
  CheckSquare,
  Square,
  ArrowLeft,
  Wand2
} from 'lucide-react';
import { queryAPI, schemaAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format as formatSQL } from 'sql-formatter';

// 注册 AG Grid 模块
ModuleRegistry.registerModules([ClientSideRowModelModule, CsvExportModule]);

// 难度颜色映射
const difficultyColors = {
  '简单': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  '中等': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  '困难': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
};

const SQLEditor = () => {
  const navigate = useNavigate();
  const FONT_COLOR_OPTIONS = [
    { label: '默认', value: 'default', light: '#1f2937', dark: '#e5e7eb' },
    { label: '青蓝', value: 'cyan', light: '#0e7490', dark: '#67e8f9' },
    { label: '翠绿', value: 'green', light: '#166534', dark: '#86efac' },
    { label: '琥珀', value: 'amber', light: '#92400e', dark: '#fcd34d' },
    { label: '粉紫', value: 'violet', light: '#6d28d9', dark: '#c4b5fd' },
    { label: '玫红', value: 'rose', light: '#be123c', dark: '#fda4af' },
  ];

  const [editorPrefs, setEditorPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('sql_editor_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalizedTheme = parsed.theme === 'dark' ? 'dark' : 'light';
        const normalizedFontColor = FONT_COLOR_OPTIONS.some((c) => c.value === parsed.fontColor)
          ? parsed.fontColor
          : 'default';
        const normalizedFontSize = Number(parsed.fontSize) || 14;
        return {
          theme: normalizedTheme,
          fontColor: normalizedFontColor,
          fontSize: normalizedFontSize,
        };
      }
    } catch (error) {
      console.error('读取编辑器配置失败', error);
    }
    return {
      theme: 'light',
      fontColor: 'default',
      fontSize: 14,
    };
  });

  // 从 localStorage 读取保存的 SQL
  const [sql, setSql] = useState(() => {
    const savedSql = localStorage.getItem('sql_editor_content');
    return savedSql || '';
  });

  // 当前题目信息
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    const saved = localStorage.getItem('sql_editor_question');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // 是否显示提示
  const [showHint, setShowHint] = useState(false);
  // 是否显示答案
  const [showSolution, setShowSolution] = useState(false);
  // 已完成题目列表
  const [completedQuestions, setCompletedQuestions] = useState(() => {
    const saved = localStorage.getItem('completed_questions');
    return saved ? JSON.parse(saved) : [];
  });

  const [result, setResult] = useState(() => {
    const savedResult = localStorage.getItem('sql_editor_result');
    if (savedResult) {
      try {
        const parsed = JSON.parse(savedResult);
        if (parsed && parsed.success && Array.isArray(parsed.data) && parsed.data.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('解析保存的结果失败:', e);
      }
      localStorage.removeItem('sql_editor_result');
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [schema, setSchema] = useState([]);
  const [tableSchemas, setTableSchemas] = useState({});
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('sql_editor_prefs', JSON.stringify(editorPrefs));
  }, [editorPrefs]);

  const applyEditorTheme = (monaco, prefs) => {
    const baseTheme = prefs.theme === 'dark' ? 'vs-dark' : 'vs';
    const selected = FONT_COLOR_OPTIONS.find((c) => c.value === prefs.fontColor) || FONT_COLOR_OPTIONS[0];
    const foreground = prefs.theme === 'dark' ? selected.dark : selected.light;
    const background = prefs.theme === 'dark' ? '#111827' : '#ffffff';
    const lineNumber = prefs.theme === 'dark' ? '#6b7280' : '#9ca3af';
    const safeForeground = foreground.replace('#', '');

    const sharedRules = [
      { token: '', foreground: safeForeground },
      { token: 'keyword', foreground: safeForeground },
      { token: 'keyword.sql', foreground: safeForeground },
      { token: 'identifier', foreground: safeForeground },
      { token: 'identifier.sql', foreground: safeForeground },
      { token: 'number', foreground: safeForeground },
      { token: 'number.sql', foreground: safeForeground },
      { token: 'string', foreground: safeForeground },
      { token: 'string.sql', foreground: safeForeground },
      { token: 'comment', foreground: safeForeground },
      { token: 'comment.sql', foreground: safeForeground },
      { token: 'operator', foreground: safeForeground },
      { token: 'operator.sql', foreground: safeForeground },
      { token: 'delimiter', foreground: safeForeground },
      { token: 'delimiter.sql', foreground: safeForeground },
      { token: 'type', foreground: safeForeground },
      { token: 'type.sql', foreground: safeForeground },
      { token: 'predefined', foreground: safeForeground },
      { token: 'predefined.sql', foreground: safeForeground },
    ];

    monaco.editor.defineTheme('offersql-custom', {
      base: baseTheme,
      inherit: true,
      rules: sharedRules,
      colors: {
        'editor.background': background,
        'editor.foreground': foreground,
        'editorCursor.foreground': foreground,
        'editorLineNumber.foreground': lineNumber,
        'editorLineNumber.activeForeground': foreground,
        'editor.selectionBackground': '#93c5fd55',
        'editor.inactiveSelectionBackground': '#bfdbfe33',
      },
    });
    monaco.editor.setTheme('offersql-custom');
  };

  // 当 SQL 内容变化时保存到 localStorage
  useEffect(() => {
    localStorage.setItem('sql_editor_content', sql);
  }, [sql]);

  // 当题目信息变化时保存
  useEffect(() => {
    if (currentQuestion) {
      localStorage.setItem('sql_editor_question', JSON.stringify(currentQuestion));
    } else {
      localStorage.removeItem('sql_editor_question');
    }
  }, [currentQuestion]);

  // 当查询结果变化时保存到 localStorage
  useEffect(() => {
    if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
      localStorage.setItem('sql_editor_result', JSON.stringify(result));
    } else if (result === null) {
      localStorage.removeItem('sql_editor_result');
    }
  }, [result]);

  // 获取数据库 Schema
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await schemaAPI.getSchema();
        if (response.success) {
          setSchema(response.data);
          // 构建表结构映射
          const schemaMap = {};
          response.data.forEach(table => {
            schemaMap[table.name] = table;
          });
          setTableSchemas(schemaMap);
        }
      } catch (error) {
        console.error('获取 Schema 失败:', error);
      }
    };
    fetchSchema();
  }, []);

  // 使用 ref 存储 schema
  const schemaRef = useRef([]);
  useEffect(() => {
    schemaRef.current = schema;
  }, [schema]);

  // 解析 SQL 获取已引用的表名
  const getReferencedTables = (sql) => {
    if (!sql) return [];
    const tables = new Set();

    const fromMatches = sql.match(/FROM\s+(\w+)/gi);
    if (fromMatches) {
      fromMatches.forEach(match => {
        const table = match.replace(/FROM\s+/i, '').trim();
        tables.add(table.toLowerCase());
      });
    }

    const joinMatches = sql.match(/JOIN\s+(\w+)/gi);
    if (joinMatches) {
      joinMatches.forEach(match => {
        const table = match.replace(/JOIN\s+/i, '').trim();
        tables.add(table.toLowerCase());
      });
    }

    const updateMatches = sql.match(/UPDATE\s+(\w+)/gi);
    if (updateMatches) {
      updateMatches.forEach(match => {
        const table = match.replace(/UPDATE\s+/i, '').trim();
        tables.add(table.toLowerCase());
      });
    }

    const intoMatches = sql.match(/INTO\s+(\w+)/gi);
    if (intoMatches) {
      intoMatches.forEach(match => {
        const table = match.replace(/INTO\s+/i, '').trim();
        tables.add(table.toLowerCase());
      });
    }

    return Array.from(tables);
  };

  // 注册 SQL 自动补全
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    applyEditorTheme(monaco, editorPrefs);
    editor.updateOptions({ fontSize: editorPrefs.fontSize });

    if (window._sqlCompletionProvider) {
      window._sqlCompletionProvider.dispose();
    }

    window._sqlCompletionProvider = monaco.languages.registerCompletionItemProvider('sql', {
      triggerCharacters: ['.', ' ', '*', '('],
      provideCompletionItems: (model, position) => {
        const currentSchema = schemaRef.current || [];
        const fullText = model.getValue();

        const lineText = model.getLineContent(position.lineNumber);
        const textBeforeCursor = lineText.substring(0, position.column - 1);
        const tablePrefixMatch = textBeforeCursor.match(/(\w+)\.$/);

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [];

        if (tablePrefixMatch) {
          const tableName = tablePrefixMatch[1].toLowerCase();
          const table = currentSchema.find(t => t.name.toLowerCase() === tableName);

          if (table) {
            table.columns.forEach(col => {
              suggestions.push({
                label: col.name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: col.name,
                detail: `${col.type}${col.primaryKey ? ' (PK)' : ''}`,
                documentation: {
                  value: `表: ${table.name}\n字段: ${col.name}\n类型: ${col.type}\n可空: ${col.nullable ? '是' : '否'}${col.primaryKey ? '\n主键: 是' : ''}`
                },
                range: range,
              });
            });
          }
          return { suggestions };
        }

        const referencedTables = getReferencedTables(fullText);
        const hasSpecifiedTables = referencedTables.length > 0;

        const keywords = [
          'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'JOIN',
          'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP BY', 'ORDER BY',
          'HAVING', 'LIMIT', 'OFFSET', 'AND', 'OR', 'NOT', 'IN', 'EXISTS',
          'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL', 'COUNT', 'SUM',
          'AVG', 'MAX', 'MIN', 'AS', 'DISTINCT', 'ALL', 'UNION', 'CASE',
          'WHEN', 'THEN', 'ELSE', 'END', 'CREATE', 'TABLE', 'VALUES'
        ];

        keywords.forEach(keyword => {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range,
          });
        });

        currentSchema.forEach(table => {
          const isReferencedTable = referencedTables.includes(table.name.toLowerCase());

          suggestions.push({
            label: table.name,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: table.name,
            detail: isReferencedTable ? `✅ 当前表` : `📋 Table`,
            documentation: {
              value: `表: ${table.name}\n字段: ${table.columns.map(c => c.name).join(', ')}`
            },
            sortText: isReferencedTable ? '0' + table.name : '1' + table.name,
            range: range,
          });

          table.columns.forEach(col => {
            const shouldShowField = !hasSpecifiedTables || isReferencedTable;

            if (shouldShowField) {
              suggestions.push({
                label: col.name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: col.name,
                detail: `📎 ${table.name}.${col.name}`,
                sortText: isReferencedTable ? '0' + col.name : '1' + col.name,
                range: range,
              });

              suggestions.push({
                label: `${table.name}.${col.name}`,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: `${table.name}.${col.name}`,
                detail: `📌 ${col.type}${col.primaryKey ? ' (PK)' : ''}`,
                documentation: {
                  value: `表: ${table.name}\n字段: ${col.name}\n类型: ${col.type}\n可空: ${col.nullable ? '是' : '否'}${col.primaryKey ? '\n主键: 是' : ''}`
                },
                sortText: isReferencedTable ? '0' + col.name : '1' + col.name,
                range: range,
              });
            }
          });
        });

        return { suggestions };
      },
    });
  };

  useEffect(() => {
    if (monacoRef.current) {
      applyEditorTheme(monacoRef.current, editorPrefs);
    }
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize: editorPrefs.fontSize });
    }
  }, [editorPrefs]);

  // 执行 SQL
  const handleExecute = async () => {
    if (!sql.trim()) {
      toast.error('请输入 SQL 语句');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // 如果有当前题目，传递题目ID来记录提交
      const questionId = currentQuestion?.id;
      const response = await queryAPI.execute(sql, questionId);

      if (response.success) {
        setResult(response);
        toast.success(`查询成功，返回 ${response.meta.rowCount} 行数据`);
      }
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setIsLoading(false);
    }
  };

  // 查看表结构
  const viewTableSchema = (tableName) => {
    const schema = tableSchemas[tableName];
    if (schema) {
      const columns = schema.columns.map(c => `• ${c.name}: ${c.type}${c.primaryKey ? ' (主键)' : ''}`).join('\n');
      toast.success(`表 ${tableName} 结构：\n${columns}`, {
        duration: 5000,
      });
    }
  };

  // 标记当前题目完成状态
  const toggleComplete = () => {
    if (!currentQuestion) return;

    const newCompleted = completedQuestions.includes(currentQuestion.id)
      ? completedQuestions.filter(id => id !== currentQuestion.id)
      : [...completedQuestions, currentQuestion.id];

    setCompletedQuestions(newCompleted);
    localStorage.setItem('completed_questions', JSON.stringify(newCompleted));
  };

  // 清除当前题目
  const clearQuestion = () => {
    setCurrentQuestion(null);
    setSql('');
    setResult(null);
    setShowHint(false);
    setShowSolution(false);
    localStorage.removeItem('sql_editor_content');
    localStorage.removeItem('sql_editor_result');
    localStorage.removeItem('sql_editor_question');
    toast.success('已清除题目和代码');
  };

  // 导出 CSV
  const handleExportCSV = () => {
    if (!result || !result.data || result.data.length === 0) {
      toast.error('没有数据可导出');
      return;
    }

    const headers = result.columns.join(',');
    const rows = result.data.map((row) =>
      result.columns.map((col) => {
        const value = row[col];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `query_result_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    link.click();

    toast.success('CSV 导出成功');
  };

  const handleFormatSQL = () => {
    if (!sql || !sql.trim()) {
      toast.error('没有可格式化的 SQL');
      return;
    }
    try {
      const formatted = formatSQL(sql, {
        language: 'mysql',
        tabWidth: 2,
        keywordCase: 'upper',
      });
      setSql(formatted);
      toast.success('SQL 已格式化');
    } catch (error) {
      toast.error('SQL 格式化失败，请检查语法');
    }
  };

  // Monaco Editor 配置
  const editorOptions = {
    minimap: { enabled: false },
    fontSize: editorPrefs.fontSize,
    fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
    formatOnPaste: true,
    formatOnType: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    parameterHints: { enabled: true },
    snippetSuggestions: 'top',
    wordBasedSuggestions: 'off',
  };

  const diffColor = currentQuestion ? difficultyColors[currentQuestion.difficulty] : null;
  const isCompleted = currentQuestion && completedQuestions.includes(currentQuestion.id);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 题目信息面板 */}
      {currentQuestion && (
        <div className="bg-white border-b shadow-sm">
          {/* 题目头部 */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-sm text-gray-400 font-mono">#{currentQuestion.id}</span>
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${diffColor?.bg} ${diffColor?.text} ${diffColor?.border}`}>
                    {currentQuestion.difficulty}
                  </span>
                  <span className="flex items-center space-x-1 px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-200">
                    <Tag size={12} />
                    <span>{currentQuestion.category}</span>
                  </span>
                  {isCompleted && (
                    <span className="flex items-center space-x-1 px-2.5 py-0.5 bg-green-50 text-green-600 text-xs font-medium rounded-full border border-green-200">
                      <CheckCircle size={12} />
                      <span>已完成</span>
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <BookOpen size={22} className="mr-2 text-blue-600" />
                  {currentQuestion.title}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate('/questions')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>返回题库</span>
                </button>
                <button
                  onClick={toggleComplete}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isCompleted ? <CheckSquare size={16} /> : <Square size={16} />}
                  <span>{isCompleted ? '已完成' : '标记完成'}</span>
                </button>
                <button
                  onClick={clearQuestion}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                >
                  <X size={16} />
                  <span>清除</span>
                </button>
              </div>
            </div>
          </div>

          {/* 题目详情 */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50/50 to-blue-50/30">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左侧：描述和表 */}
              <div className="space-y-4">
                {/* 题目描述 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FileQuestion size={16} className="mr-1.5 text-blue-500" />
                    题目描述
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {currentQuestion.description}
                  </p>
                </div>

                {/* 相关数据表 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Database size={16} className="mr-1.5 text-purple-500" />
                    相关数据表
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.tables.map(table => (
                      <button
                        key={table}
                        onClick={() => viewTableSchema(table)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
                      >
                        <Table size={12} />
                        <span>{table}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 右侧：提示和答案 */}
              <div className="space-y-3">
                {/* 提示 */}
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h3 className="text-sm font-semibold text-amber-800 flex items-center">
                      <Lightbulb size={16} className="mr-1.5 text-amber-600" />
                      解题思路
                    </h3>
                    {showHint ? <EyeOff size={14} className="text-amber-600" /> : <Eye size={14} className="text-amber-600" />}
                  </button>
                  {showHint && (
                    <p className="mt-2 text-amber-700 text-sm leading-relaxed">
                      {currentQuestion.hint}
                    </p>
                  )}
                </div>

                {/* 参考答案 */}
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h3 className="text-sm font-semibold text-gray-300 flex items-center">
                      <Award size={16} className="mr-1.5 text-yellow-500" />
                      参考答案
                    </h3>
                    {showSolution ? <EyeOff size={14} className="text-gray-400" /> : <Eye size={14} className="text-gray-400" />}
                  </button>
                  {showSolution && (
                    <pre className="mt-3 overflow-x-auto">
                      <code className="text-green-400 text-sm font-mono">
                        {currentQuestion.solution}
                      </code>
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主编辑区域 */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* 工具栏 */}
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-800 flex items-center">
              <FileCode size={18} className="mr-2 text-blue-600" />
              SQL 编辑器
            </h1>
            {!currentQuestion && (
              <span className="text-sm text-gray-400">
                从面试题库选择题目开始练习，或直接编写 SQL
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFormatSQL}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg text-sm transition-colors"
            >
              <Wand2 size={14} />
              <span>格式化</span>
            </button>
            <div className="flex items-center space-x-1 px-2 py-1 rounded-lg border border-gray-200 bg-gray-50">
              <span className="text-xs text-gray-500">主题</span>
              <select
                value={editorPrefs.theme}
                onChange={(e) => setEditorPrefs((prev) => ({ ...prev, theme: e.target.value }))}
                className="text-xs bg-transparent text-gray-700 outline-none"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 rounded-lg border border-gray-200 bg-gray-50">
              <span className="text-xs text-gray-500">字色</span>
              <select
                value={editorPrefs.fontColor}
                onChange={(e) => setEditorPrefs((prev) => ({ ...prev, fontColor: e.target.value }))}
                className="text-xs bg-transparent text-gray-700 outline-none"
              >
                {FONT_COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 rounded-lg border border-gray-200 bg-gray-50">
              <span className="text-xs text-gray-500">字号</span>
              <select
                value={editorPrefs.fontSize}
                onChange={(e) => setEditorPrefs((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
                className="text-xs bg-transparent text-gray-700 outline-none"
              >
                {[12, 13, 14, 15, 16, 18, 20].map((size) => (
                  <option key={size} value={size}>{size}px</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setSql('');
                setResult(null);
                localStorage.removeItem('sql_editor_content');
                localStorage.removeItem('sql_editor_result');
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg text-sm transition-colors"
            >
              <Trash2 size={14} />
              <span>清空</span>
            </button>
            <button
              onClick={handleExecute}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
              <span>{isLoading ? '执行中' : '执行 SQL'}</span>
            </button>
          </div>
        </div>

        {/* 编辑器 */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            defaultLanguage="sql"
            value={sql}
            onChange={setSql}
            options={editorOptions}
            onMount={handleEditorDidMount}
            theme="vs"
          />
        </div>

        {/* 查询结果面板 */}
        <div className="h-64 border-t bg-white flex flex-col">
          {/* 结果头部 */}
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-blue-100 rounded">
                <Table size={16} className="text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">查询结果</span>
            </div>

            {result ? (
              <div className="flex items-center space-x-3">
                {result.meta && (
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center space-x-1 px-2 py-0.5 bg-white rounded text-xs text-gray-600 border">
                      <Clock size={12} />
                      <span>{result.meta.executionTime}ms</span>
                    </span>
                    <span className="flex items-center space-x-1 px-2 py-0.5 bg-white rounded text-xs text-gray-600 border">
                      <CheckCircle size={12} className="text-green-500" />
                      <span>{result.meta.rowCount} 行</span>
                    </span>
                  </div>
                )}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                >
                  <Download size={12} />
                  <span>导出 CSV</span>
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    localStorage.removeItem('sql_editor_result');
                  }}
                  className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <span className="text-xs text-gray-400">等待查询...</span>
            )}
          </div>

          {/* 结果内容 */}
          <div className="flex-1 overflow-auto">
            {!result && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Database size={32} className="mb-2 text-gray-300" />
                <p className="text-sm">执行 SQL 查询查看结果</p>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Loader2 size={32} className="animate-spin mb-2 text-blue-500" />
                <p className="text-sm">执行中...</p>
              </div>
            )}

            {result && (
              <div className="p-4">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {result.columns.map((col) => (
                          <th
                            key={col}
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {result.columns.map((col) => (
                            <td
                              key={col}
                              className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                            >
                              {row[col] ?? <span className="text-gray-400 italic">NULL</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SQLEditor;
