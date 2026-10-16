# JARVIS Interpreter Edition

Русская локальная версия компьютерного ассистента на базе **Interpreter Workstation**.

Цель проекта: оставить сильный агентный движок Interpreter (Computer Use, браузер, файлы, инструменты), но сделать оболочку понятной на русском, локальной по умолчанию и без обязательных платных API.

## Текущая ветка: 0.3.1

- локальные модели через Ollama;
- русский интерфейс и русские статусы;
- Windows Computer Use и браузер из Interpreter;
- без обязательного OpenAI API / hosted billing;
- облегчённые визуальные эффекты для меньшей нагрузки;
- Windows-установщик собирается автоматически через GitHub Actions.

## Как устроена сборка

GitHub Actions берёт зафиксированный исходник Interpreter Workstation:

`f88bca02b9353167e2b5790f59ff48ce4ccd5015`

затем применяет наши изменения и собирает unsigned Windows x64 NSIS installer. В этом upstream-коммите уже закреплены нужные submodules `interpreter-extension` и `interpreter-cua`.

## Лицензия и происхождение

Основа: Open Interpreter / Interpreter Workstation, Apache License 2.0. Исходные уведомления и лицензии upstream сохраняются в итоговой сборке. Изменённые файлы относятся к JARVIS Interpreter Edition.

> JARVIS — рабочее название этой экспериментальной сборки. Перед коммерческим выпуском бренд нужно проверить отдельно.
