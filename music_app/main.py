#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Модуль main.py
Главный модуль приложения для работы с аудио-эмбеддингами
"""

import os
import sys
import logging
import argparse
import time
from pathlib import Path

from music_app.clap_model import clap_model
from music_app.track_embeddings import TrackEmbeddings

# Настраиваем логирование
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def setup_args():
    """
    Настраивает аргументы командной строки.
    """
    parser = argparse.ArgumentParser(description='Приложение для работы с аудио-эмбеддингами')
    
    parser.add_argument('--audio_dir', type=str, default='audio_samples',
                        help='Директория с аудио файлами для обработки')
    
    parser.add_argument('--embeddings_dir', type=str, default='embeddings',
                        help='Директория для сохранения эмбеддингов')
    
    parser.add_argument('--mode', type=str, choices=['generate', 'compare', 'info'],
                        default='generate', help='Режим работы приложения')
    
    parser.add_argument('--files', type=str, nargs='+', 
                        help='Конкретные аудиофайлы для обработки')
    
    parser.add_argument('--compare', type=str, nargs=2,
                        help='Сравнить два аудиофайла (указать два пути)')
    
    return parser.parse_args()

def process_audio_files(audio_files, embeddings_manager):
    """
    Обрабатывает список аудиофайлов и создает для них эмбеддинги.
    
    Args:
        audio_files (list): Список путей к аудиофайлам
        embeddings_manager (TrackEmbeddings): Менеджер эмбеддингов
        
    Returns:
        list: Список созданных эмбеддингов
    """
    results = []
    
    for audio_file in audio_files:
        logger.info(f"Обработка файла: {audio_file}")
        
        # Генерируем эмбеддинг для файла
        embedding_vector = embeddings_manager.create_embedding_vector(audio_file)
        
        if embedding_vector:
            logger.info(f"Эмбеддинг успешно создан для {audio_file}")
            results.append(embedding_vector)
        else:
            logger.error(f"Не удалось создать эмбеддинг для {audio_file}")
            
    return results

def compare_audio_files(file1, file2, embeddings_manager):
    """
    Сравнивает два аудиофайла, вычисляя сходство между их эмбеддингами.
    
    Args:
        file1 (str): Путь к первому аудиофайлу
        file2 (str): Путь ко второму аудиофайлу
        embeddings_manager (TrackEmbeddings): Менеджер эмбеддингов
        
    Returns:
        float: Значение сходства между файлами
    """
    logger.info(f"Сравнение файлов: {file1} и {file2}")
    
    # Генерируем эмбеддинги
    emb1 = embeddings_manager.generate_embedding(file1)
    emb2 = embeddings_manager.generate_embedding(file2)
    
    if emb1 is None or emb2 is None:
        logger.error("Не удалось получить эмбеддинги для сравнения")
        return None
    
    # Вычисляем косинусное сходство
    similarity = embeddings_manager.cosine_similarity(emb1, emb2)
    
    logger.info(f"Сходство между файлами: {similarity:.4f}")
    return similarity

def get_model_info():
    """
    Выводит информацию о CLAP модели.
    
    Returns:
        dict: Информация о модели
    """
    model_info = clap_model.get_model_info()
    
    if model_info:
        logger.info("Информация о CLAP модели:")
        for key, value in model_info.items():
            logger.info(f"  {key}: {value}")
    else:
        logger.warning("Не удалось получить информацию о CLAP модели")
        
    return model_info

def main():
    """
    Основная функция приложения.
    """
    # Получаем аргументы командной строки
    args = setup_args()
    
    # Создаем директории, если их нет
    os.makedirs(args.audio_dir, exist_ok=True)
    os.makedirs(args.embeddings_dir, exist_ok=True)
    
    # Инициализируем менеджер эмбеддингов
    embeddings_manager = TrackEmbeddings(args.embeddings_dir)
    
    # Выводим информацию о модели
    logger.info("Запуск приложения для работы с аудио-эмбеддингами")
    get_model_info()
    
    # Проверяем, готова ли CLAP модель
    if not clap_model.is_ready():
        logger.warning("CLAP модель не готова, ожидаем загрузки...")
        max_attempts = 5
        for attempt in range(max_attempts):
            time.sleep(2)  # Ждем 2 секунды перед повторной проверкой
            if clap_model.is_ready():
                logger.info("CLAP модель успешно загружена")
                break
            logger.warning(f"Попытка {attempt+1}/{max_attempts}: модель все еще не готова")
        
        # Пробуем перезагрузить модель, если она все еще не готова
        if not clap_model.is_ready():
            logger.warning("CLAP модель не загрузилась, пробуем перезагрузить")
            clap_model.reload_model()
            time.sleep(3)  # Ждем 3 секунды после перезагрузки
    
    # Выполняем действие в зависимости от выбранного режима
    if args.mode == 'generate':
        # Определяем список файлов для обработки
        if args.files:
            audio_files = args.files
        else:
            # Обрабатываем все аудиофайлы в директории
            audio_dir = Path(args.audio_dir)
            audio_files = [str(file) for file in audio_dir.glob('*.mp3')]
            audio_files.extend([str(file) for file in audio_dir.glob('*.wav')])
            audio_files.extend([str(file) for file in audio_dir.glob('*.flac')])
        
        if audio_files:
            logger.info(f"Найдено {len(audio_files)} аудиофайлов для обработки")
            process_audio_files(audio_files, embeddings_manager)
        else:
            logger.warning(f"Не найдено аудиофайлов для обработки в {args.audio_dir}")
    
    elif args.mode == 'compare':
        # Сравниваем два файла
        if args.compare and len(args.compare) == 2:
            file1, file2 = args.compare
            compare_audio_files(file1, file2, embeddings_manager)
        else:
            logger.error("Для сравнения необходимо указать два аудиофайла с помощью --compare")
    
    elif args.mode == 'info':
        # Выводим информацию о модели
        get_model_info()
    
    logger.info("Работа приложения завершена")

if __name__ == "__main__":
    main() 