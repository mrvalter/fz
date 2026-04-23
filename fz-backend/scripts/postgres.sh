#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Конфигурация
ENV_FILE=".env.db"
COMPOSE_FILE="docker-compose.yml"

# Функции
print_msg() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Создание .env файла
create_env() {
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Файл $ENV_FILE не найден. Создаю..."
        cat > "$ENV_FILE" << EOF
# PostgreSQL Configuration
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=fz_database
DB_PORT=5433

# pgAdmin Configuration
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin
PGADMIN_PORT=5050
EOF
        print_msg "Файл $ENV_FILE создан"
        print_info "Измени пароли и другие настройки в .env.db при необходимости"
    fi
}

# Загрузка переменных
load_env() {
    if [ -f "$ENV_FILE" ]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    fi
}

# Запуск всех сервисов
start() {
    print_msg "Запуск PostgreSQL и pgAdmin через Podman..."
    podman-compose --env-file $ENV_FILE -f $COMPOSE_FILE up -d
    
    if [ $? -eq 0 ]; then
        sleep 5
        print_msg "Сервисы успешно запущены"
        status
        print_info "pgAdmin доступен по адресу: http://localhost:${PGADMIN_PORT:-5050}"
    else
        print_error "Ошибка при запуске сервисов"
    fi
}

# Запуск только PostgreSQL (без pgAdmin)
start_db_only() {
    print_msg "Запуск только PostgreSQL..."
    podman-compose --env-file $ENV_FILE -f $COMPOSE_FILE up -d postgres
    
    if [ $? -eq 0 ]; then
        print_msg "PostgreSQL успешно запущен"
        status
    else
        print_error "Ошибка при запуске PostgreSQL"
    fi
}

# Остановка сервисов
stop() {
    print_msg "Остановка сервисов..."
    podman-compose -f $COMPOSE_FILE down
    print_msg "Сервисы остановлены"
}

# Перезапуск
restart() {
    print_msg "Перезапуск сервисов..."
    podman-compose -f $COMPOSE_FILE restart
    print_msg "Сервисы перезапущены"
}

# Статус
status() {
    echo -e "\n${GREEN}=== Статус контейнеров ===${NC}"
    podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo -e "\n${GREEN}=== Информация для подключения ===${NC}"
    load_env
    echo -e "PostgreSQL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@localhost:${DB_PORT:-5432}/${DB_NAME:-fz_database}"
    echo -e "pgAdmin:    http://localhost:${PGADMIN_PORT:-5050}"
    echo -e "  Email: ${PGADMIN_EMAIL:-admin@admin.com}"
    echo -e "  Password: ${PGADMIN_PASSWORD:-admin}"
}

# Логи
logs() {
    print_info "Логи сервисов (Ctrl+C для выхода)"
    podman-compose -f $COMPOSE_FILE logs -f
}

# Логи только PostgreSQL
logs_db() {
    print_info "Логи PostgreSQL (Ctrl+C для выхода)"
    podman logs -f fz_postgres
}

# Логи только pgAdmin
logs_pgadmin() {
    print_info "Логи pgAdmin (Ctrl+C для выхода)"
    podman logs -f fz_pgadmin
}

# Подключение через psql
connect() {
    load_env
    print_info "Подключение к PostgreSQL (psql)..."
    print_info "Выход: \\q"
    podman exec -it fz_postgres psql -U ${DB_USER:-postgres} -d ${DB_NAME:-fz_database}
}

# Бэкап
backup() {
    load_env
    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME:-fz_database}_$TIMESTAMP.sql"
    
    print_info "Создание бэкапа..."
    podman exec fz_postgres pg_dump -U ${DB_USER:-postgres} ${DB_NAME:-fz_database} > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_msg "Бэкап создан: $BACKUP_FILE"
        print_info "Размер: $(du -h $BACKUP_FILE | cut -f1)"
    else
        print_error "Ошибка при создании бэкапа"
    fi
}

# Восстановление
restore() {
    load_env
    BACKUP_FILE=$2
    
    if [ -z "$BACKUP_FILE" ]; then
        print_error "Укажите файл бэкапа"
        echo "Использование: $0 restore <файл.sql>"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Файл $BACKUP_FILE не найден"
        exit 1
    fi
    
    print_warning "Это перезапишет текущую базу данных!"
    read -p "Вы уверены? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Восстановление из $BACKUP_FILE..."
        cat "$BACKUP_FILE" | podman exec -i fz_postgres psql -U ${DB_USER:-postgres} -d ${DB_NAME:-fz_database}
        
        if [ $? -eq 0 ]; then
            print_msg "База данных восстановлена"
        else
            print_error "Ошибка при восстановлении"
        fi
    else
        print_msg "Операция отменена"
    fi
}

# Сброс пароля pgAdmin
reset_pgadmin() {
    print_warning "Это удалит данные pgAdmin (сохраненные подключения)"
    read -p "Продолжить? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        podman volume rm fz_pgadmin_data
        print_msg "Данные pgAdmin удалены. При следующем запуске создадутся заново"
        print_msg "Перезапусти сервисы: $0 restart"
    fi
}

# Очистка всего
clean() {
    print_warning "ЭТО УДАЛИТ ВСЕ ДАННЫЕ (PostgreSQL + pgAdmin)!"
    read -p "Вы уверены? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_msg "Остановка и удаление всех данных..."
        podman-compose -f $COMPOSE_FILE down -v
        print_msg "Все данные удалены"
    else
        print_msg "Операция отменена"
    fi
}

# Помощь
help() {
    echo -e "\n${GREEN}=== Управление PostgreSQL + pgAdmin ===${NC}"
    echo -e "  ${YELLOW}start${NC}          - Запустить все сервисы"
    echo -e "  ${YELLOW}start-db${NC}       - Запустить только PostgreSQL"
    echo -e "  ${YELLOW}stop${NC}           - Остановить все сервисы"
    echo -e "  ${YELLOW}restart${NC}        - Перезапустить сервисы"
    echo -e "  ${YELLOW}status${NC}         - Показать статус и данные для входа"
    echo -e "  ${YELLOW}logs${NC}           - Показать логи всех сервисов"
    echo -e "  ${YELLOW}logs-db${NC}        - Показать логи PostgreSQL"
    echo -e "  ${YELLOW}logs-pgadmin${NC}   - Показать логи pgAdmin"
    echo -e "  ${YELLOW}connect${NC}        - Подключиться через psql"
    echo -e "  ${YELLOW}backup${NC}         - Создать бэкап БД"
    echo -e "  ${YELLOW}restore${NC}        - Восстановить из бэкапа"
    echo -e "  ${YELLOW}reset-pgadmin${NC}  - Сбросить данные pgAdmin"
    echo -e "  ${YELLOW}clean${NC}          - Полностью удалить все данные"
    echo -e "  ${YELLOW}help${NC}           - Показать справку"
}

# Основная логика
case "$1" in
    start)
        create_env
        start
        ;;
    start-db)
        create_env
        start_db_only
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    logs-db)
        logs_db
        ;;
    logs-pgadmin)
        logs_pgadmin
        ;;
    connect)
        connect
        ;;
    backup)
        backup
        ;;
    restore)
        restore "$@"
        ;;
    reset-pgadmin)
        reset_pgadmin
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        help
        ;;
    *)
        echo -e "${RED}Неизвестная команда: $1${NC}"
        help
        exit 1
        ;;
esac