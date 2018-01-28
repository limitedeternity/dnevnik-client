# -*- coding: utf-8 -*-

from os import chdir, environ
from os.path import dirname, abspath
from collections import Counter
from datetime import datetime, timedelta
from random import choice
from re import findall, match
from json import loads
from pytz import utc
from flask import Flask, render_template, make_response, request, redirect, jsonify, abort, send_from_directory
from flask_cache import Cache # Caching
from flask_sslify import SSLify # Ensure HTTPS
from flask_compress import Compress # Compression
from flask_cors import CORS # Request origin Control
from requests import Session
from requests.adapters import HTTPAdapter
from requests.exceptions import ConnectionError
from cachecontrol import CacheControl

debug = False
compress = Compress()

app = Flask(__name__, template_folder='templates')
app.config['SECRET_KEY'] = environ.get("SECRET_KEY", "".join(choice("abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)") for _ in range(50)))
app.config['COMPRESS_MIMETYPES'] = ['text/html', 'application/json']
app.config['COMPRESS_MIN_SIZE'] = 0

if not debug:
    app.config['REMEMBER_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_SECURE'] = True
    cache = Cache(app, config={'CACHE_TYPE': 'redis', 'CACHE_REDIS_URL': environ.get("REDIS_URL")})
    sslify = SSLify(app)
    CORS(app, origins="https://dnevnik-client.herokuapp.com")

compress.init_app(app)


'''
Required functionality
'''

@app.after_request
def set_headers(response):
    if request.method == "GET":

        accept_encoding = request.headers.get('Accept-Encoding', '')

        if 'br' not in accept_encoding.lower():
            return response

        if (response.status_code < 200 or response.status_code >= 300 or 'Content-Encoding' in response.headers):
            return response

        response.direct_passthrough = False

        if request.path.endswith(".js.br"):
            response.headers['Content-Encoding'] = 'br'
            response.headers['Vary'] = 'Accept-Encoding'
            response.headers['Content-Type'] = 'application/javascript'
            response.headers['Server'] = 'Unicorn'
            response.headers['Content-Length'] = len(response.data)
            return response

        elif request.path.endswith(".css.br"):
            response.headers['Content-Encoding'] = 'br'
            response.headers['Vary'] = 'Accept-Encoding'
            response.headers['Content-Type'] = 'text/css'
            response.headers['Server'] = 'Unicorn'
            response.headers['Content-Length'] = len(response.data)
            return response

        elif request.path.endswith("sw.js"):
            response.headers['Cache-Control'] = 'no-cache, max-age=0'
            return response

        else:
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Server'] = 'Unicorn'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000'
            return response

    else:
        return response


def timeDate(typeDate, offset, feed=False):
    time = None

    if not feed:
        if (datetime.now(tz=utc) + timedelta(hours=offset)).weekday() == 6:
            time = datetime.now(tz=utc) + timedelta(hours=offset, days=1)

        elif (datetime.now(tz=utc) + timedelta(hours=offset)).weekday() + 1 == 6:
            if (datetime.now(tz=utc) + timedelta(hours=offset)).hour < 14:
                time = datetime.now(tz=utc) + timedelta(hours=offset)

            else:
                time = datetime.now(tz=utc) + timedelta(hours=offset, days=2)

        else:
            if (datetime.now(tz=utc) + timedelta(hours=offset)).hour < 15:
                time = datetime.now(tz=utc) + timedelta(hours=offset)

            else:
                time = datetime.now(tz=utc) + timedelta(hours=offset, days=1)

    else:
        time = datetime.now(tz=utc) + timedelta(hours=offset)

    if typeDate == 'day':
        return str(time.day)

    elif typeDate == 'month':
        return str(time.month)

    elif typeDate == 'year':
        return str(time.year)


def coloring(mood=None):
    if mood == "Good":
        return "teal"

    elif (mood == "Average") or (mood == "О"):
        return "#FF5722"

    elif (mood == "Bad") or (mood == "Н"):
        return "red"

    elif (mood == "Б") or (mood == "П"):
        return "#01579B"

    else:
        return "#212121"


def kaomoji(mood=None):
    if mood == "Good":
        return "<br>( ˙꒳​˙ )"

    elif mood == "Average":
        return "<br>(--_--)"

    elif mood == "Bad":
        return "<br>(・・ )"

    else:
        return "ヽ(ー_ー )ノ"

'''
Template handling
'''


@app.route("/", methods=['GET'])
def index():
    response = make_response(render_template('index.html'))
    return response


@app.route("/main", methods=['GET'])
def main():
    if 'AccessToken' in request.cookies:
        s = CacheControl(Session())
        s.mount('http://', HTTPAdapter(max_retries=5))
        s.mount('https://', HTTPAdapter(max_retries=5))

        offline = False

        try:
            access_token = request.cookies.get('AccessToken', '')
            res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
            user_data = loads(res_userdata.text)

        except ConnectionError:
            offline = True

        if 'apiRequestLimit' in user_data.values() or 'parameterInvalid' in user_data.values() or 'invalidToken' in user_data.values():
            response = make_response(redirect("/logout"))
            return response

        if request.cookies.get("AccountType") == 'Student':
            response = make_response(render_template('index_logged_in.html'))

        elif request.cookies.get("AccountType") == 'Parent':
            if offline or 'apiServerError' in user_data.values():
                opts = ({"Профилактические работы": "1337"})

            else:
                options = user_data['children']
                opts = []

                for option in options:
                    opts.append({f"{option['firstName']} {option['lastName']}": option['personId']})

            response = make_response(render_template('index_logged_in.html', opts=opts))

        else:
            response = make_response(render_template('index_logged_in.html'))

    else:
        response = make_response(redirect("/"))

    return response


@app.route("/feed", methods=['POST'])
def feed():
    if 'AccessToken' in request.cookies:
        s = CacheControl(Session())
        s.mount('http://', HTTPAdapter(max_retries=5))
        s.mount('https://', HTTPAdapter(max_retries=5))

        offline = False

        try:
            access_token = request.cookies.get('AccessToken')
            res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
            user_data = loads(res_userdata.text)

        except ConnectionError:
            offline = True

        if offline or 'apiServerError' in user_data.values():
            user = "товарищ Тестер"
            feed = (("Упс...", coloring(), "Дневник.ру оффлайн", "=)"))

        elif 'apiRequestLimit' in user_data.values() or 'parameterInvalid' in user_data.values() or 'invalidToken' in user_data.values():
            response = make_response(redirect("/logout"))
            return response

        else:
            user = user_data['firstName']
            if request.cookies.get("AccountType") == 'Student':
                offset = int(request.cookies.get('Offset', '3'))

                day = str(timeDate('day', offset=offset, feed=True))
                month = str(timeDate('month', offset=offset, feed=True))
                year = str(timeDate('year', offset=offset, feed=True))

                day = "0" + day if match(r"^\d{1}$", day) else day
                month = "0" + month if match(r"^\d{1}$", month) else month

                feed = []

                res_userfeed = s.get(f"https://api.dnevnik.ru/mobile/v2/feed/?date={year}-{month}-{day}&limit=1&personId={user_data['personId']}&groupId={user_data['groupIds'][0]}&access_token={access_token}")

                recent_data = loads(res_userfeed.text)['Feed']['Days'][0]['MarkCards']

                for card in recent_data:
                    for value in card['Values']:
                        feed.append((value['Value'], coloring(value['Mood']), card["Subject"]["Name"], card["WorkType"]["Kind"]))

        if request.cookies.get("AccountType") == 'Student':
            html_out = [f'<h4>Здравствуйте, {user}!</h4>']

            if feed:
                html_out.append('<ul class="mdl-list" style="width: 300px;">')
                for item in feed:
                    html_out.append(f'<li class="mdl-list__item mdl-list__item--two-line"><span class="mdl-list__item-primary-content"><i class="material-icons mdl-list__item-avatar">info</i><span style="color:{item[1]}">{item[0]}</span><span class="mdl-list__item-sub-title">{item[2]} - {item[3]}</span></span><span class="mdl-list__item-secondary-content"><a class="mdl-list__item-secondary-action" href="#"><i class="material-icons">label</i></a></span></li>')
                html_out.append("</ul>")

            else:
                html_out.append('Спасибо, что решили протестировать beta-версию DnevnikClient. Я очень это ценю. <br>Обо всех ошибках просьба сообщать, открывая Issue в <a href="https://github.com/limitedeternity/dnevnik-client/" target="_blank" rel="noopener">репозитории на GitHub</a>. <br>Надеюсь, вам нравится клиент, и вы довольны его функционалом и проделанной мной работой. <br>Напоминаю, что проект - Open Source, так что вы в любой момент можете помочь разработке. <br>By <a href="https://github.com/limitedeternity/" target="_blank" rel="noopener">@limitedeternity</a>')

            return make_response(jsonify(''.join(html_out)))

        elif request.cookies.get("AccountType") == 'Parent':
            html_out = f'<h4>Здравствуйте, {user}!</h4> Спасибо, что решили протестировать beta-версию DnevnikClient. Я очень это ценю. <br>Обо всех ошибках просьба сообщать, открывая Issue в <a href="https://github.com/limitedeternity/dnevnik-client/" target="_blank" rel="noopener">репозитории на GitHub</a>. <br>Надеюсь, вам нравится клиент, и вы довольны его функционалом и проделанной мной работой. <br>Напоминаю, что проект - Open Source, так что вы в любой момент можете помочь разработке. <br>By <a href="https://github.com/limitedeternity/" target="_blank" rel="noopener">@limitedeternity</a>'
            return make_response(jsonify(html_out))

        else:
            html_out = '<h4>О проекте</h4>DnevnikClient - облегченная версия Дневник.Ру, расчитанная на просмотр данных, помещенная в рамки Material Design. Клиент предоставляет функционал ровно в такой мере, которая требуется ученикам. Без тяжелого обвеса вроде ReactJS, избыточных элементов интерфейса и функционала "соцсети". <br> Ничего лишнего. <br>Исходный код доступен в моем <a href="https://github.com/limitedeternity/dnevnik-client/" target="_blank" rel="noopener">репозитории GitHub</a>. <br>By <a href="https://github.com/limitedeternity/" target="_blank" rel="noopener">@limitedeternity</a>'
            return make_response(jsonify(html_out))

    else:
        response = make_response(redirect("/"))
        return response


@app.route("/stats", methods=['POST'])
def stats():
    if 'AccessToken' in request.cookies:
        s = CacheControl(Session())
        s.mount('http://', HTTPAdapter(max_retries=5))
        s.mount('https://', HTTPAdapter(max_retries=5))

        childId = request.get_json(force=True).get('child', '')

        try:
            access_token = request.cookies.get('AccessToken')
            res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
            user_data = loads(res_userdata.text)

            if 'apiServerError' in user_data.values():
                raise ConnectionError

            elif 'apiRequestLimit' in user_data.values() or 'parameterInvalid' in user_data.values() or 'invalidToken' in user_data.values():
                response = make_response(redirect("/logout"))
                return response

        except ConnectionError:
            html_out = '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные не получены ¯\_(ツ)_/¯</h5>Кажется, Дневник.Ру ушел в оффлайн :> <br>Если вы сумели успешно запросить данные ранее, то сделайте длинное нажатие по кнопке запроса.</div>'

            response = make_response(jsonify(html_out))
            return response

        res_marks = None
        if request.cookies.get('AccountType') == 'Student':
            res_marks = s.get(f"https://api.dnevnik.ru/mobile/v2/allMarks?personId={user_data['personId']}&groupId={user_data['groupIds'][0]}&access_token={access_token}")

        elif request.cookies.get('AccountType') == 'Parent':
            for child in user_data['children']:
                if childId == str(child['personId']):
                    res_marks = s.get(f"https://api.dnevnik.ru/mobile/v2/allMarks?personId={childId}&groupId={child['groupIds'][0]}&access_token={access_token}")

            if res_marks == None:
                res_marks = s.get(f"https://api.dnevnik.ru/mobile/v2/allMarks?personId={user_data['children'][0]['personId']}&groupId={user_data['children'][0]['groupIds'][0]}&access_token={access_token}")

        marks_data = loads(res_marks.text)["AllMarks"]

        html_out = ['<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4>']

        for markData in marks_data:
            for subjectData in markData["SubjectMarks"]:
                markCollection = []

                html_out.append('<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><div style="display:block; height:2px; clear:both;"></div><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;">format_list_bulleted</i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><div style="display:block; height:2px; clear:both;"></div>')
                html_out.append(f'<h5 style="font-weight:600">{subjectData["Name"]}</h5>')

                for mark in subjectData["Marks"]:
                    markCollection.append((mark["Values"][0]["Value"], mark["Values"][0]["Mood"]))

                markCollectionCounted = (*Counter(sorted(markCollection)).items(),)[::-1]
                markSum = 0
                markTotal = len(markCollection)

                for markTuple in markCollectionCounted:
                    try:
                        html_out.append(f'<h8 style="color:{coloring(markTuple[0][1])};">{markTuple[0][0]}: {markTuple[1]}</h8><br>')
                        markSum += int(markTuple[0][0]) * int(markTuple[1])

                    except (KeyError, IndexError):
                        pass

                try:
                    html_out.append(f'<h8 style="color:{coloring()};">Среднее значение: {round(markSum / markTotal, 2)}</h8><br>')

                except ZeroDivisionError:
                    html_out.append(f'<h8 style="color:{coloring()};">Среднее значение: n/a</h8><br>')

                try:
                    html_out.append(f'<h8 style="color:{coloring(subjectData["FinalMark"]["Values"][0]["Mood"])};">Итоговое значение: {subjectData["FinalMark"]["Values"][0]["Value"]}</h8><br>')

                except (KeyError, IndexError, TypeError):
                    pass

                html_out.append('<div style="display:block; height:5px; clear:both;"></div></div>')

        response = make_response(jsonify(''.join(html_out)))
        return response

    else:
        response = make_response(redirect("/"))
        return response


@app.route("/dnevnik", methods=['POST'])
def dnevnik():
    if 'AccessToken' in request.cookies:
        s = CacheControl(Session())
        s.mount('http://', HTTPAdapter(max_retries=5))
        s.mount('https://', HTTPAdapter(max_retries=5))

        timeMonth = request.get_json(force=True).get('month', '')
        timeDay = request.get_json(force=True).get('day', '')
        childId = request.get_json(force=True).get('child', '')

        offset = int(request.cookies.get('Offset', '3'))

        try:
            access_token = request.cookies.get('AccessToken')
            res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
            user_data = loads(res_userdata.text)

            if 'apiServerError' in user_data.values():
                raise ConnectionError

            elif 'apiRequestLimit' in user_data.values() or 'parameterInvalid' in user_data.values() or 'invalidToken' in user_data.values():
                response = make_response(redirect("/logout"))
                return response

        except ConnectionError:
            html_out = '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные не получены ¯\_(ツ)_/¯</h5>Кажется, Дневник.Ру ушел в оффлайн :> <br>Если вы сумели успешно запросить данные ранее, то сделайте длинное нажатие по кнопке запроса.</div>'

            response = make_response(jsonify(html_out))
            return response

        if timeDay is '':
            day = str(timeDate('day', offset=offset))

        else:
            day = timeDay

        if timeMonth is '':
            month = str(timeDate('month', offset=offset))

        else:
            month = timeMonth

        year = str(timeDate('year', offset=offset))

        day = "0" + day if match(r"^\d{1}$", day) else day
        month = "0" + month if match(r"^\d{1}$", month) else month

        res_lessons = None
        if request.cookies.get('AccountType') == 'Student':
            res_lessons = s.get(f"https://api.dnevnik.ru/mobile/v2/schedule?startDate={year}-{month}-{day}&endDate={year}-{month}-{day}&personId={user_data['personId']}&groupId={user_data['groupIds'][0]}&access_token={access_token}")

        elif request.cookies.get('AccountType') == 'Parent':
            for child in user_data['children']:
                if childId == str(child['personId']):
                    res_lessons = s.get(f"https://api.dnevnik.ru/mobile/v2/schedule?startDate={year}-{month}-{day}&endDate={year}-{month}-{day}&personId={childId}&groupId={child['groupIds'][0]}&access_token={access_token}")

            if res_lessons == None:
                res_lessons = s.get(f"https://api.dnevnik.ru/mobile/v2/schedule?startDate={year}-{month}-{day}&endDate={year}-{month}-{day}&personId={user_data['children'][0]['personId']}&groupId={user_data['children'][0]['groupIds'][0]}&access_token={access_token}")

        lesson_data = loads(res_lessons.text)['Days'][0]['Schedule']

        if lesson_data == []:
            html_out = '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Упс...</h5>Уроков нет. Вот незадача :></div>'

            response = make_response(jsonify(html_out))
            return response

        html_out = ['<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>']
        for lesson in lesson_data:
            try:
                lesson_name = lesson["Subject"]["Name"]

            except (KeyError, TypeError):
                continue

            html_out.append('<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><div style="display:block; height:2px; clear:both;"></div><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;">format_list_bulleted</i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><div style="display:block; height:2px; clear:both;"></div>')
            html_out.append(f'<h5 style="font-weight:600">{lesson_name}</h5>')

            for mark in lesson['Marks']:
                if mark:
                    if mark["MarkType"] == 'LogEntry':
                        html_out.append(f'<h8 style="color:{coloring(mark["Values"][0]["Value"])};">Присутствие: {mark["MarkTypeText"]}.</h8><br>')

                    elif mark["MarkType"] == "Mark":
                        if len(mark['Values']) > 1:
                            html_out.append('<div style="display:block; height:2px; clear:both;"></div>')

                        for markValue in mark['Values']:
                            html_out.append(f'<h8 style="color:{coloring(markValue["Mood"])};">Оценка: {markValue["Value"]} ({mark["MarkTypeText"]}) {kaomoji(markValue["Mood"])}</h8><br>')

                        if len(mark['Values']) > 1:
                            html_out.append('<div style="display:block; height:2px; clear:both;"></div>')

            if lesson["Theme"] is not '':
                try:
                    html_out.append(f'<h8 style="color:{coloring()};">Урок: {lesson["Theme"]} ({lesson["ImportantWorks"][0]["WorkType"]})</h8><br>')

                except (KeyError, IndexError):
                    html_out.append(f'<h8 style="color:{coloring()};">Урок: {lesson["Theme"]}</h8><br>')

            else:
                pass

            if lesson["HomeworksText"] is not "":
                hw = lesson["HomeworksText"]
                links = (*set(findall(r"http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+", hw)),)

                for link in links:
                    hw = hw.replace(link, f'<a href="{link}" target="_blank" rel="noopener">[ссылка]</a>')

                html_out.append(f'<h8 style="color:{coloring()};">ДЗ: {hw}</h8><br>')

            else:
                html_out.append(f'<h8 style="color:{coloring()};">ДЗ: нет {kaomoji()}</h8><br>')

            html_out.append('<div style="display:block; height:5px; clear:both;"></div></div>')

        response = make_response(jsonify(''.join(html_out)))
        return response

    else:
        response = make_response(redirect("/"))
        return response


@app.route("/login", methods=['GET'])
def log_in():
    accounttype = None

    s = CacheControl(Session())
    s.mount('http://', HTTPAdapter(max_retries=5))
    s.mount('https://', HTTPAdapter(max_retries=5))

    try:
        access_token = request.cookies.get('AccessToken_Temp', '')
        res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
        user_data = loads(res_userdata.text)

        if 'apiServerError' in user_data.values() or 'parameterInvalid' in user_data.values() or 'invalidToken' in user_data.values():
            raise ConnectionError

    except ConnectionError:
        response = make_response(redirect("/"))
        response.set_cookie('AccessToken_Temp', value='', max_age=0, expires=0)
        return response

    try:
        type_block = user_data['roles']

    except KeyError:
        response = make_response(redirect("/"))
        response.set_cookie('AccessToken_Temp', value='', max_age=0, expires=0)
        return response

    if "EduStudent" in type_block:
        accounttype = "Student"

    elif "EduParent" in type_block:
        accounttype = "Parent"

    else:
        return jsonify("Пора задуматься о том, куда катится ваша жизнь.")

    response = make_response(redirect("/"))
    response.set_cookie('AccessToken_Temp', value='', max_age=0, expires=0)
    response.set_cookie('AccountType', value=accounttype, max_age=2592000, expires=2592000, secure=True)
    response.set_cookie('AccessToken', value=access_token, max_age=2592000, expires=2592000, secure=True)
    return response


@app.route("/apply", methods=['POST'])
def apply():
    color = request.get_json(force=True).get('color', '')

    if color not in ("Teal", "Deep Orange", "Deep Purple", "Pink"):
        html_out = '<div style="display:block; height:2px; clear:both;"></div><p style="text-align:center; color:red;">Кто-то против смены темы c:</p>'
        return make_response(jsonify(html_out))

    html_out = '<div style="display:block; height:2px; clear:both;"></div><p style="text-align:center; color:green;">Смена цветовой схемы успешна ^^</p>'
    response = make_response(jsonify(html_out))
    response.set_cookie('Theme', value=color, max_age=2592000, expires=2592000, secure=True)
    return response


@app.route("/logout", methods=['GET'])
def log_out():
    s = CacheControl(Session())
    s.mount('http://', HTTPAdapter(max_retries=5))
    s.mount('https://', HTTPAdapter(max_retries=5))

    offline = False

    try:
        access_token = request.cookies.get('AccessToken', '')
        res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
        user_data = loads(res_userdata.text)

        if 'apiServerError' in user_data.values():
            raise ConnectionError

    except ConnectionError:
        offline = True

    response = make_response(redirect('/'))

    if 'AccessToken' in request.cookies and not offline:
        response.set_cookie('AccessToken', value='', max_age=0, expires=0)
        response.set_cookie('AccountType', value='', max_age=0, expires=0)
        response.set_cookie('Offset', value='', max_age=0, expires=0)

    return response


@app.route('/js/<path:path>', methods=['GET'])
def serve_js(path):
    return send_from_directory('static/js', path)


@app.route('/css/<path:path>', methods=['GET'])
def serve_css(path):
    return send_from_directory('static/css', path)


@app.route('/images/<path:path>', methods=['GET'])
def serve_images(path):
    return send_from_directory('static/images', path)


@app.route('/fonts/<path:path>', methods=['GET'])
def serve_fonts(path):
    return send_from_directory('static/fonts', path)


@app.route('/config/<path:path>', methods=['GET'])
def serve_config(path):
    return send_from_directory('static/config', path)


@app.route('/sw.js', methods=['GET'])
def serviceworker():
    return send_from_directory('sw', 'sw.js')


if __name__ == "__main__":
    chdir(dirname(abspath(__file__)))
    app.run(debug=debug, use_reloader=True)
