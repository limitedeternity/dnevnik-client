# -*- coding: utf-8 -*-

from os import chdir, environ
from os.path import dirname, abspath
from collections import Counter
from datetime import datetime, timedelta
from random import choice, randint
from re import findall
from json import loads
from pytz import utc
from flask import Flask, render_template, make_response, send_from_directory, request, redirect, jsonify, abort
from flask_cache import Cache # Caching
from flask_sslify import SSLify # Ensure HTTPS
from flask_wtf.csrf import CSRFProtect # CSRF
from whitenoise import WhiteNoise # Easy static serve
from requests import Session
from requests.adapters import HTTPAdapter
from requests.exceptions import ConnectionError
from cachecontrol import CacheControl

debug = False

app = Flask(__name__, template_folder='templates')
app.config['SECRET_KEY'] = environ.get("SECRET_KEY", "".join(choice("abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)") for _ in range(50)))
app.wsgi_app = WhiteNoise(app.wsgi_app, root="static/")

if not debug:
    app.config['REMEMBER_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_SECURE'] = True

    cache = Cache(app, config={'CACHE_TYPE': 'redis', 'CACHE_REDIS_URL': environ.get("REDIS_URL")})
    csrf = CSRFProtect(app)
    sslify = SSLify(app)


'''
Required functionality
'''


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
        return "( ˙꒳​˙ )"

    elif mood == "Average":
        return "(--_--)"

    elif mood == "Bad":
        return "(・・ )"

    else:
        return "ヽ(ー_ー )ノ"

'''
Template handling
'''


@app.route("/", methods=['GET'])
def index():
    response = make_response(render_template('index.html'))

    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000'
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
            response = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
            user_data = loads(response.text)

        except ConnectionError:
            offline = True

        if offline:
            user = "товарищ Тестер"

        else:
            user = user_data['firstName']

        if request.cookies.get("AccountType") == 'Student':
            response = make_response(render_template('index_logged_in.html', user=user))

        elif request.cookies.get("AccountType") == 'Parent':
            if offline:
                opts = [{"Профилактические работы": str(randint(0, 2000))}]

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

    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000'
    response.set_cookie('Offset', value='', max_age=0, expires=0)
    return response


@app.route("/stats", methods=['POST'])
def stats():
    if 'AccessToken' in request.cookies:
        s = CacheControl(Session())
        s.mount('http://', HTTPAdapter(max_retries=5))
        s.mount('https://', HTTPAdapter(max_retries=5))

        termPeriod = request.form.get('term', '1')

        try:
            access_token = request.cookies.get('AccessToken')
            response = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
            user_data = loads(response.text)

        except ConnectionError:
            html_out = ""
            html_out += '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4>'

            html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
            html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
            html_out += '</div>'
            html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
            html_out += '<h5>Данные не получены ¯\_(ツ)_/¯</h5>'
            html_out += 'Кажется, Дневник.Ру ушел в оффлайн :> <br>'
            html_out += 'Если вы сумели успешно запросить данные ранее, то сделайте длинное нажатие по кнопке запроса.'
            html_out += '</div>'

            response = make_response(jsonify(html_out))
            response.set_cookie('Offset', value='', max_age=0, expires=0)
            return response

        try:
            if request.cookies.get('AccountType') == 'Student':
                response = s.get(f"https://api.dnevnik.ru/mobile/v2/allMarks?personId={user_data['personId']}&groupId={user_data['groupIds'][0]}&access_token={access_token}")

            elif request.cookies.get('AccountType') == 'Parent':
                childId = request.form.get('child', '')
                for child in user_data['children']:
                    if childId == child['personId']:
                        response = s.get(f"https://api.dnevnik.ru/mobile/v2/allMarks?personId={childId}&groupId={child['groupIds'][0]}&access_token={access_token}")

            marks_data = loads(response.text)["AllMarks"]

            html_out = ""
            html_out += '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4>'

            for markData in marks_data:
                if termPeriod in markData["Period"]["Text"]:
                    for subjectData in markData["SubjectMarks"]:
                        subjectId = subjectData["SubjectId"]
                        markCollection = []

                        html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
                        html_out += '<div style="display:block; height:2px; clear:both;"></div><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;">format_list_bulleted</i>'
                        html_out += '</div>'
                        html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
                        html_out += '<div style="display:block; height:2px; clear:both;"></div>'
                        html_out += f'<h5 style="font-weight:600">{subjectData["Name"]}</h5>'

                        for mark in subjectData["Marks"]:
                            markCollection.append((mark["Values"][0]["Value"], mark["Values"][0]["Mood"]))

                        markCollectionCounted = (*Counter(sorted(markCollection)).items(),)

                        try:
                            for markTuple in markCollectionCounted:
                                html_out += f'<h8 style="color:{coloring(markTuple[0][1])};">{markTuple[0][0]}: {markTuple[1]}</h8><br>'

                        except (KeyError, IndexError):
                            pass

                        try:
                            html_out += f'<h8 style="color:{coloring(subjectData["FinalMark"]["Values"][0]["Mood"])};">Итоговое значение: {subjectData["FinalMark"]["Values"][0]["Value"]}</h8><br>'

                        except (KeyError, IndexError, TypeError):
                            pass

                        try:
                            if request.cookies.get('AccountType') == 'Student':
                                response = s.get(f"https://api.dnevnik.ru/mobile/v2/allMarks?personId={user_data['personId']}&groupId={user_data['groupIds'][0]}&subjectId={subjectId}&access_token={access_token}")

                            elif request.cookies.get('AccountType') == 'Parent':
                                for child in user_data['children']:
                                    if childId == child['personId']:
                                        response = s.get(f"https://api.dnevnik.ru/mobile/v2/allMarks?personId={childId}&groupId={child['groupIds'][0]}&subjectId={subjectId}&access_token={access_token}")

                            average_mark = loads(response.text)["SubjectMarks"]["Avg"]

                            html_out += f'<h8 style="color:{coloring(average_mark["Mood"])};">Среднее значение: {average_mark["CommonWorksAvg"]["Value"]}</h8><br>'
                            html_out += f'<h8 style="color:{coloring(average_mark["Mood"])};">Среднее значение (важн.): {average_mark["ImportantWorksAvg"]["Value"]}</h8><br>'

                        except (KeyError, ConnectionError):
                            pass

                        html_out += '<div style="display:block; height:5px; clear:both;"></div>'
                        html_out += '</div>'

            response = make_response(jsonify(html_out))
            response.set_cookie('Offset', value='', max_age=0, expires=0)
            return response

        except ConnectionError:
            html_out = ""
            html_out += '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4>'

            html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
            html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
            html_out += '</div>'
            html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
            html_out += '<h5>Данные не получены ¯\_(ツ)_/¯</h5>'
            html_out += 'Кажется, Дневник.Ру ушел в оффлайн :> <br>'
            html_out += 'Если вы сумели успешно запросить данные ранее, то сделайте длинное нажатие по кнопке запроса.'
            html_out += '</div>'

            response = make_response(jsonify(html_out))
            response.set_cookie('Offset', value='', max_age=0, expires=0)
            return response

    else:
        html_out = ""
        html_out += '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4>'

        html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
        html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
        html_out += '</div>'
        html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
        html_out += '<h5>Залогиньтесь ¯\_(ツ)_/¯</h5>'
        html_out += 'Вы явно такого не ожидали, не правда ли?'
        html_out += '</div>'

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

        offset = int(request.cookies.get('Offset'))

        try:
            access_token = request.cookies.get('AccessToken')
            response = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")
            user_data = loads(response.text)

            if timeDay is '':
                day = timeDate('day', offset=offset, )

            else:
                day = timeDay

            if timeMonth is '':
                month = timeDate('month', offset)

            else:
                month = timeMonth

            year = timeDate('year', offset)

            if request.cookies.get('AccountType') == 'Student':
                response = s.get(f"https://api.dnevnik.ru/mobile/v2/schedule?startDate={year}-{month}-{day}&endDate={year}-{month}-{day}&personId={user_data['personId']}&groupId={user_data['groupIds'][0]}&access_token={access_token}")

            elif request.cookies.get('AccountType') == 'Parent':
                childId = request.form.get('child', '')
                for child in user_data['children']:
                    if childId == child['personId']:
                        response = s.get(f"https://api.dnevnik.ru/mobile/v2/schedule?startDate={year}-{month}-{day}&endDate={year}-{month}-{day}&personId={childId}&groupId={child['groupIds'][0]}&access_token={access_token}")

            try:
                lesson_data = loads(response.text)['Days'][0]['Schedule']

            except (KeyError, IndexError):
                html_out = ""
                html_out += '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>'

                html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
                html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
                html_out += '</div>'
                html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
                html_out += '<h5>Данные не получены ¯\_(ツ)_/¯</h5>'
                html_out += 'Уроков нет :>'
                html_out += '</div>'

                response = make_response(jsonify(html_out))
                response.set_cookie('Offset', value='', max_age=0, expires=0)
                return response

            if lesson_data == []:
                html_out = ""
                html_out += '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>'

                html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
                html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
                html_out += '</div>'
                html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
                html_out += '<h5>Данные не получены ¯\_(ツ)_/¯</h5>'
                html_out += 'Уроков нет :>'
                html_out += '</div>'

                response = make_response(jsonify(html_out))
                response.set_cookie('Offset', value='', max_age=0, expires=0)
                return response

            html_out = ""
            html_out += '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>'

            for lesson in lesson_data:

                if lesson['Status'] == 'NotInitialised':
                    continue

                else:
                    html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
                    html_out += '<div style="display:block; height:2px; clear:both;"></div><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;">format_list_bulleted</i>'
                    html_out += '</div>'
                    html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
                    html_out += '<div style="display:block; height:2px; clear:both;"></div>'

                    html_out += f'<h5 style="font-weight:600">{lesson["Subject"]["Name"]}</h5>'

                    for mark in lesson['Marks']:
                        if mark:
                            if mark["MarkType"] == 'LogEntry':
                                html_out += f'<h8 style="color:{coloring(mark["Values"][0]["Value"])};">Присутствие: {mark["MarkTypeText"]}.</h8><br>'

                            elif mark["MarkType"] == "Mark":
                                if len(mark['Values']) > 1:
                                    html_out += '<div style="display:block; height:2px; clear:both;"></div>'

                                for markValue in mark['Values']:
                                    html_out += f'<h8 style="color:{coloring(markValue["Mood"])};">Оценка: {markValue["Value"]} ({mark["MarkTypeText"]}) {kaomoji(markValue["Mood"])}</h8><br>'

                                if len(mark['Values']) > 1:
                                    html_out += '<div style="display:block; height:2px; clear:both;"></div>'

                    try:
                        html_out += f'<h8 style="color:{coloring()};">Урок: {lesson["Theme"]} ({lesson["ImportantWorks"][0]["WorkType"]})</h8><br>'

                    except (KeyError, IndexError):
                        try:
                            html_out += f'<h8 style="color:{coloring()};">Урок: {lesson["Theme"]}</h8><br>'

                        except (KeyError, IndexError):
                            pass

                    if lesson["HomeworksText"] != "":
                        hw = lesson["HomeworksText"]
                        links = list(set(findall(r"http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+", hw)))

                        for link in links:
                            hw = hw.replace(link, f'<a href="{link}" target="_blank">[ссылка]</a>')

                        html_out += f'<h8 style="color:{coloring()};">ДЗ: {hw}</h8><br>'

                html_out += '<div style="display:block; height:5px; clear:both;"></div>'
                html_out += '</div>'

        except ConnectionError:
            html_out = ""
            html_out += '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>'

            html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
            html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
            html_out += '</div>'
            html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
            html_out += '<h5>Данные не получены ¯\_(ツ)_/¯</h5>'
            html_out += 'API Дневник.Ру в оффлайне :> <br>'
            html_out += 'Если вы сумели успешно запросить данные ранее, то сделайте длинное нажатие по кнопке запроса.'
            html_out += '</div>'

            response = make_response(jsonify(html_out))
            response.set_cookie('Offset', value='', max_age=0, expires=0)
            return response

        response = make_response(jsonify(html_out))
        response.set_cookie('Offset', value='', max_age=0, expires=0)
        return response

    else:
        html_out = ""
        html_out += '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>'

        html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
        html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
        html_out += '</div>'
        html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
        html_out += '<h5>Залогиньтесь ¯\_(ツ)_/¯</h5>'
        html_out += 'Вы явно такого не ожидали, не правда ли?'
        html_out += '</div>'

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
        access_token = request.cookies.get('AccessToken_Temp')

        response = s.get(f"https://api.dnevnik.ru/v1/users/me/context?access_token={access_token}")

        try:
            s.cookies.get_dict()['dnevnik_sst']

        except KeyError:
            response = make_response(redirect("/"))
            response.set_cookie('AccessToken_Temp', value='', max_age=0, expires=0)
            return response

        user_data = loads(response.text)

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

    html_out = ""
    html_out += '<div style="display:block; height:2px; clear:both;"></div>'
    html_out += '<p style="text-align:center; color:green;">Смена цветовой схемы успешна ^^</p>'

    response = make_response(jsonify(html_out))
    response.set_cookie('Theme', value=color, max_age=2592000, expires=2592000)
    return response


@app.route("/logout", methods=['GET'])
def log_out():
    s = CacheControl(Session())
    s.mount('http://', HTTPAdapter(max_retries=5))
    s.mount('https://', HTTPAdapter(max_retries=5))

    s.headers.update({'Upgrade-Insecure-Requests': '1',
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
                      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                      'DNT': '1',
                      'Accept-Encoding': 'gzip, deflate, br',
                      'Accept-Language': 'ru-RU,en-US;q=0.8,ru;q=0.6,en;q=0.4'})

    offline = False

    try:
        s.get('https://dnevnik.ru/')

    except ConnectionError:
        offline = True

    response = make_response(redirect('/'))

    if 'AccessToken' in request.cookies and not offline:
        response.set_cookie('AccessToken', value='', max_age=0, expires=0)
        response.set_cookie('AccountType', value='', max_age=0, expires=0)
        response.set_cookie('Offset', value='', max_age=0, expires=0)

    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000'
    return response


@app.route('/sw.js', methods=['GET'])
def serviceworker():
    return send_from_directory('sw', 'sw.js')


@app.route('/sw/<path:path>', methods=['GET'])
def serve_sw(path):
    if path != 'sw.js':
        return send_from_directory('sw', path)

    else:
        abort(404)


if __name__ == "__main__":
    chdir(dirname(abspath(__file__)))
    app.run(debug=debug, use_reloader=True)
