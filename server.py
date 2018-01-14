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


def timeDate(typeDate, offset):
    time = None

    if (datetime.now(tz=utc) + timedelta(hours=offset)).weekday() == 6:
        time = datetime.now(tz=utc) + timedelta(hours=offset, days=1)

    elif (datetime.now(tz=utc) + timedelta(hours=offset)).weekday() + 1 == 6:
        if (datetime.now(tz=utc) + timedelta(hours=offset)).hour < 15:
            time = datetime.now(tz=utc) + timedelta(hours=offset)

        else:
            time = datetime.now(tz=utc) + timedelta(hours=offset, days=2)

    else:
        if (datetime.now(tz=utc) + timedelta(hours=offset)).hour < 15:
            time = datetime.now(tz=utc) + timedelta(hours=offset)

        else:
            time = datetime.now(tz=utc) + timedelta(hours=offset, days=1)

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
    response.set_cookie('Offset', value='', max_age=0, expires=0)
    return response


@app.route("/main", methods=['GET'])
def main():
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

        elif 'apiRequestLimit' in user_data.values() or 'authorizationInvalidToken' in user_data.values():
            response = make_response(redirect("/logout"))
            return response

        else:
            user = user_data['firstName']

        if request.cookies.get("AccountType") == 'Student':
            response = make_response(render_template('index_logged_in.html', user=user))

        elif request.cookies.get("AccountType") == 'Parent':
            if offline or 'apiServerError' in user_data.values():
                opts = [{"Профилактические работы": "1337"}]

            else:
                options = user_data['children']
                opts = []

                for option in options:
                    opts.append({f"{option['firstName']} {option['lastName']}": option['personId']})

            response = make_response(render_template('index_logged_in.html', opts=opts, user=user))

        else:
            response = make_response(render_template('index_logged_in.html'))

    else:
        response = make_response(redirect("/"))

    response.set_cookie('Offset', value='', max_age=0, expires=0)
    return response


@app.route("/stats", methods=['POST'])
def stats():
    if 'AccessToken' in request.cookies:
        s = CacheControl(Session())
        s.mount('http://', HTTPAdapter(max_retries=5))
        s.mount('https://', HTTPAdapter(max_retries=5))

        childId = request.form.get('child', '')

        try:
            access_token = request.cookies.get('AccessToken')
            res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
            user_data = loads(res_userdata.text)

            if 'apiServerError' in user_data.values():
                raise ConnectionError

            elif 'apiRequestLimit' in user_data.values() or 'authorizationInvalidToken' in user_data.values():
                response = make_response(redirect("/logout"))
                response.set_cookie('Offset', value='', max_age=0, expires=0)
                return response

        except ConnectionError:
            html_out = '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные не получены ¯\_(ツ)_/¯</h5>Кажется, Дневник.Ру ушел в оффлайн :> <br>Если вы сумели успешно запросить данные ранее, то сделайте длинное нажатие по кнопке запроса.</div>'

            response = make_response(jsonify(html_out))
            response.set_cookie('Offset', value='', max_age=0, expires=0)
            return response

        res_marks = None
        if request.cookies.get('AccountType') == 'Student':
            res_marks = s.get(f"https://api.dnevnik.ru/mobile/v2/allMarks?personId={user_data['personId']}&groupId={user_data['groupIds'][0]}&access_token={access_token}")

        elif request.cookies.get('AccountType') == 'Parent':
            for child in user_data['children']:
                if childId == str(child['personId']):
                    res_marks = s.get(f"https://api.dnevnik.ru/mobile/v2/allMarks?personId={childId}&groupId={child['groupIds'][0]}&access_token={access_token}")

        marks_data = loads(res_marks.text)["AllMarks"]

        html_out = ['<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4>']

        for markData in marks_data:
            for subjectData in markData["SubjectMarks"]:
                markCollection = []

                html_out.append('<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><div style="display:block; height:2px; clear:both;"></div><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;">format_list_bulleted</i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><div style="display:block; height:2px; clear:both;"></div>')
                html_out.append(f'<h5 style="font-weight:600">{subjectData["Name"]}</h5>')

                for mark in subjectData["Marks"]:
                    markCollection.append((mark["Values"][0]["Value"], mark["Values"][0]["Mood"]))

                markCollectionCounted = (*Counter(sorted(markCollection)).items(),)
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
        response.set_cookie('Offset', value='', max_age=0, expires=0)
        return response

    else:
        html_out = '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Залогиньтесь ¯\_(ツ)_/¯</h5>Вы явно такого не ожидали, не правда ли?</div>'

        response = make_response(jsonify(html_out))
        response.set_cookie('Offset', value='', max_age=0, expires=0)
        return response


@app.route("/dnevnik", methods=['POST'])
def dnevnik():
    if 'AccessToken' in request.cookies:
        s = CacheControl(Session())
        s.mount('http://', HTTPAdapter(max_retries=5))
        s.mount('https://', HTTPAdapter(max_retries=5))

        timeMonth = request.form.get('month', '')
        timeDay = request.form.get('day', '')
        childId = request.form.get('child', '')

        offset = int(request.cookies.get('Offset', '3'))

        try:
            access_token = request.cookies.get('AccessToken')
            res_userdata = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
            user_data = loads(res_userdata.text)

            if 'apiServerError' in user_data.values():
                raise ConnectionError

            elif 'apiRequestLimit' in user_data.values() or 'authorizationInvalidToken' in user_data.values():
                response = make_response(redirect("/logout"))
                response.set_cookie('Offset', value='', max_age=0, expires=0)
                return response

        except ConnectionError:
            html_out = '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные не получены ¯\_(ツ)_/¯</h5>Кажется, Дневник.Ру ушел в оффлайн :> <br>Если вы сумели успешно запросить данные ранее, то сделайте длинное нажатие по кнопке запроса.</div>'

            response = make_response(jsonify(html_out))
            response.set_cookie('Offset', value='', max_age=0, expires=0)
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

        lesson_data = loads(res_lessons.text)['Days'][0]['Schedule']

        if lesson_data == []:
            html_out = '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные не получены ¯\_(ツ)_/¯</h5>Уроков нет :></div>'

            response = make_response(jsonify(html_out))
            response.set_cookie('Offset', value='', max_age=0, expires=0)
            return response

        html_out = ['<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>']

        not_initialised = []

        for lesson in lesson_data:

            if lesson['Status'] == 'NotInitialised':
                not_initialised.append(1)
                continue

            else:
                html_out.append('<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><div style="display:block; height:2px; clear:both;"></div><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;">format_list_bulleted</i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><div style="display:block; height:2px; clear:both;"></div>')
                html_out.append(f'<h5 style="font-weight:600">{lesson["Subject"]["Name"]}</h5>')

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

        if len(lesson_data) == len(not_initialised):
            html_out.append('<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Данные не получены ¯\_(ツ)_/¯</h5>Ни один урок не отмечен, как инициализированный :></div>')

        response = make_response(jsonify(''.join(html_out)))
        response.set_cookie('Offset', value='', max_age=0, expires=0)
        return response

    else:
        html_out = '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4><div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone"><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i></div><div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone"><h5>Залогиньтесь ¯\_(ツ)_/¯</h5>Вы явно такого не ожидали, не правда ли?</div>'

        response = make_response(jsonify(html_out))
        response.set_cookie('Offset', value='', max_age=0, expires=0)
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
    response.set_cookie('AccountType', value=accounttype, max_age=2592000, expires=2592000)
    response.set_cookie('AccessToken', value=access_token, max_age=2592000, expires=2592000)
    return response


@app.route("/apply", methods=['POST'])
def apply():
    color = request.form.get('color', '')

    html_out = '<div style="display:block; height:2px; clear:both;"></div><p style="text-align:center; color:green;">Смена цветовой схемы успешна ^^</p>'

    response = make_response(jsonify(html_out))
    response.set_cookie('Theme', value=color, max_age=2592000, expires=2592000)
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

        if 'apiServerError' in user_data.values() or 'parameterInvalid' in user_data.values():
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


@app.route('/sw/<path:path>', methods=['GET'])
def serve_sw(path):
    if path != 'sw.js':
        return send_from_directory('sw', path)

    else:
        return abort(404)


if __name__ == "__main__":
    chdir(dirname(abspath(__file__)))
    app.run(debug=debug, use_reloader=True)
