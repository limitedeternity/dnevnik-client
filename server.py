# -*- coding: utf-8 -*-

from flask import Flask, render_template, render_template_string, make_response, send_from_directory, request, redirect, jsonify
from random import choice
from bs4 import BeautifulSoup
from requests import Session
from datetime import datetime, timedelta
from pytz import utc
import pandas as pd
from urllib.parse import urlparse, parse_qs
from os import chdir
from json import loads
from os.path import dirname, abspath
from flask_wtf.csrf import CSRFProtect
from waitress import serve
from os import environ
from sys import argv
from cachecontrol import CacheControl
from base64 import b64encode, b64decode, b32encode, b32decode


app = Flask(__name__, template_folder='templates')
app.config['SECRET_KEY'] = environ.get("SECRET_KEY", "".join(choice("abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)") for _ in range(50)))
app.config['REMEMBER_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_SECURE'] = True
csrf = CSRFProtect(app)


'''
Required functionality
'''


def timeDate(typeDate, offset, timeMonth='', timeDay=''):

    if typeDate == 'day':
        return str((datetime.now(tz=utc) + timedelta(hours=offset)).day)

    elif typeDate == 'month':
        return str((datetime.now(tz=utc) + timedelta(hours=offset)).month)

    elif typeDate == 'year':
        return str((datetime.now(tz=utc) + timedelta(hours=offset)).year)

    elif typeDate == 'weekday':
        if timeMonth is '' or timeDay is '':
            return str((datetime.now(tz=utc) + timedelta(hours=offset)).weekday())

        else:
            return str((datetime(int(timeDate('year', offset=offset)), int(timeMonth), int(timeDay), tzinfo=utc) + timedelta(hours=offset)).weekday())


def schoolId(s):

    return str(parse_qs(urlparse(s.get("https://schools.dnevnik.ru/school.aspx").url).query)['school'][-1])


def groupId(s):
    return str(parse_qs(urlparse(s.get("https://schools.dnevnik.ru/schedules/").url).query)['group'][-1])

'''
Template handling
'''


@app.route("/", methods=['GET'])
def index():
    response = make_response(render_template('index.html'))

    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['Content-Security-Policy'] = "default-src 'self'; img-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'"
    return response


@app.route("/main", methods=['GET'])
def main():
    response = make_response(render_template('index_logged_in.html'))

    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['Content-Security-Policy'] = "default-src 'self'; img-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'"
    return response


@app.route("/stats", methods=['POST'])
def stats():
    if 'DnevnikLogin' in request.cookies:
        s = CacheControl(Session())

        termPeriod = request.form.get('term', '')

        s.headers.update({'Upgrade-Insecure-Requests': '1',
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                          'DNT': '1',
                          'Accept-Encoding': 'gzip, deflate, br',
                          'Accept-Language': 'ru-RU,en-US;q=0.8,ru;q=0.6,en;q=0.4'})

        login_payload = {'login': b64decode(b32decode(request.cookies.get('DnevnikLogin').encode('ascii'))).decode('utf-8'),
                         'password': b64decode(b32decode(request.cookies.get('DnevnikPass').encode('ascii'))).decode('utf-8'),
                         'exceededAttempts': 'False', 'ReturnUrl': ''}

        s.post('https://login.dnevnik.ru/login', login_payload)
        json_out = None

        try:
            data = s.get("https://schools.dnevnik.ru/marks.aspx?school=" + schoolId(s) + "&index=-1&tab=stats&period=" + (str(int(termPeriod) - 1) if termPeriod is not '' else "-1")).content

            tables = pd.read_html(data)[-1]
            json_out = loads(tables.to_json(force_ascii=False))

        except (ValueError, IndexError):
            html_out = ""

            html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
            html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
            html_out += '</div>'
            html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
            html_out += '<h5>Данные не получены ¯\_(ツ)_/¯</h5>'
            html_out += 'Кажется, Дневник.Ру ушел в оффлайн :> <br>'
            html_out += 'Если вы сумели успешно запросить данные ранее, то отключите Интернет и запросите снова.'
            html_out += '</div>'

            return jsonify(html_out)

        html_out = ""
        html_out += '<h4 class="mdl-cell mdl-cell--12-col">Статистика</h4>'

        for i in range(len(json_out["Предмет"])):
            html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
            html_out += '<div style="display:block; height:2px; clear:both;"></div><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;">format_list_bulleted</i>'
            html_out += '</div>'
            html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
            html_out += '<div style="display:block; height:2px; clear:both;"></div>'
            html_out += '<h5 style="font-weight:600">' + str(json_out['Предмет'][str(i)]) + '</h5>'

            # ...
            if str(json_out["5"][str(i)]) == 'None':
                html_out += '<h8 style="color:#212121;">5: 0</h8>' + "<br>"

            else:
                html_out += '<h8 style="color:green;">5: ' + str(int(float(json_out["5"][str(i)]))) + '</h8>' + "<br>"

            # ...
            if str(json_out["4"][str(i)]) == 'None':
                html_out += '<h8 style="color:#212121;">4: 0</h8>' + "<br>"

            else:
                html_out += '<h8 style="color:teal;">4: ' + str(int(float(json_out["4"][str(i)]))) + '</h8>' + "<br>"

            # ...
            if str(json_out["3"][str(i)]) == 'None':
                html_out += '<h8 style="color:#212121;">3: 0</h8>' + "<br>"

            else:
                html_out += '<h8 style="color:#FF5722;">3: ' + str(int(float(json_out["3"][str(i)]))) + '</h8>' + "<br>"

            # ...
            if str(json_out["2"][str(i)]) == 'None':
                html_out += '<h8 style="color:#212121;">2: 0</h8>' + "<br>"

            else:
                html_out += '<h8 style="color:red;">2: ' + str(int(float(json_out["2"][str(i)]))) + '</h8>' + "<br>"

            # ...
            if str(json_out["4 и 5"][str(i)]) == 'None':
                html_out += '<h8 style="color:green;">Процент: 100%</h8>' + "<br>"

            elif int(json_out["4 и 5"][str(i)][:-1]) in range(80, 101):
                html_out += '<h8 style="color:green;">Процент: ' + str(json_out["4 и 5"][str(i)]) + '</h8>' + "<br>"

            elif int(json_out["4 и 5"][str(i)][:-1]) in range(60, 80):
                html_out += '<h8 style="color:teal;">Процент: ' + str(json_out["4 и 5"][str(i)]) + '</h8>' + "<br>"

            elif int(json_out["4 и 5"][str(i)][:-1]) in range(40, 60):
                html_out += '<h8 style="color:#FF5722;">Процент: ' + str(json_out["4 и 5"][str(i)]) + '</h8>' + "<br>"

            elif int(json_out["4 и 5"][str(i)][:-1]) in range(0, 40):
                html_out += '<h8 style="color:red;">Процент: ' + str(json_out["4 и 5"][str(i)]) + '</h8>' + "<br>"

            html_out += '<div style="display:block; height:5px; clear:both;"></div>'
            html_out += '</div>'

        return jsonify(html_out)

    else:
        html_out = ""

        html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
        html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
        html_out += '</div>'
        html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
        html_out += '<h5>Залогиньтесь ¯\_(ツ)_/¯</h5>'
        html_out += 'Вы явно такого не ожидали, не правда ли?'
        html_out += '</div>'

        return jsonify(html_out)


@app.route("/summary", methods=['POST'])
def summary():
    if 'DnevnikLogin' in request.cookies:
        s = CacheControl(Session())

        s.headers.update({'Upgrade-Insecure-Requests': '1',
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                          'DNT': '1',
                          'Accept-Encoding': 'gzip, deflate, br',
                          'Accept-Language': 'ru-RU,en-US;q=0.8,ru;q=0.6,en;q=0.4'})

        login_payload = {'login': b64decode(b32decode(request.cookies.get('DnevnikLogin').encode('ascii'))).decode('utf-8'),
                         'password': b64decode(b32decode(request.cookies.get('DnevnikPass').encode('ascii'))).decode('utf-8'),
                         'exceededAttempts': 'False', 'ReturnUrl': ''}

        s.post('https://login.dnevnik.ru/login', login_payload)

        try:
            data = s.get("https://schools.dnevnik.ru/marks.aspx?school=" + schoolId(s) + "&index=-1&tab=result").content
            tables = pd.read_html(data)[-1]

            header = tables.iloc[0]
            tables = tables[1:-5]
            tables = tables.rename(columns=header)

            json_out = loads(tables.to_json(force_ascii=False))

            html_out = ""
            html_out += '<h4 class="mdl-cell mdl-cell--12-col">Итоговые</h4>'

            for i in range(len(json_out['Предметы'])):
                html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
                html_out += '<div style="display:block; height:2px; clear:both;"></div><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;">format_list_bulleted</i>'
                html_out += '</div>'
                html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
                html_out += '<div style="display:block; height:2px; clear:both;"></div>'
                html_out += '<h5 style="font-weight:600">' + str(json_out['Предметы'][str(i + 1)]) + '</h5>'

                # ...
                try:
                    # ...

                    if str(json_out["1 сем"][str(i + 1)]) == 'None':
                        html_out += '<h8 style="color:#212121;">1 cем.: нет.</h8>' + "<br>"

                    elif str(json_out["1 сем"][str(i + 1)]) == '5':
                        html_out += '<h8 style="color:green;">1 cем.: 5</h8>' + "<br>"

                    elif str(json_out["1 сем"][str(i + 1)]) == '4':
                        html_out += '<h8 style="color:teal;">1 cем.: 4</h8>' + "<br>"

                    elif str(json_out["1 сем"][str(i + 1)]) == '3':
                        html_out += '<h8 style="color:#FF5722;">1 cем.: 3</h8>' + "<br>"

                    elif str(json_out["1 сем"][str(i + 1)]) == '2':
                        html_out += '<h8 style="color:red;">1 cем.: 2</h8>' + "<br>"

                    elif str(json_out["1 сем"][str(i + 1)]) == '1':
                        html_out += '<h8 style="color:red;">1 cем.: 1</h8>' + "<br>"

                    # ...
                    if str(json_out["2 сем"][str(i + 1)]) == 'None':
                        html_out += '<h8 style="color:#212121;">2 cем.: нет.</h8>' + "<br>"

                    elif str(json_out["2 сем"][str(i + 1)]) == '5':
                        html_out += '<h8 style="color:green;">2 cем.: 5</h8>' + "<br>"

                    elif str(json_out["2 сем"][str(i + 1)]) == '4':
                        html_out += '<h8 style="color:teal;">2 cем.: 4</h8>' + "<br>"

                    elif str(json_out["2 сем"][str(i + 1)]) == '3':
                        html_out += '<h8 style="color:#FF5722;">2 cем.: 3</h8>' + "<br>"

                    elif str(json_out["2 сем"][str(i + 1)]) == '2':
                        html_out += '<h8 style="color:red;">2 cем.: 2</h8>' + "<br>"

                    elif str(json_out["2 сем"][str(i + 1)]) == '1':
                        html_out += '<h8 style="color:red;">2 cем.: 1</h8>' + "<br>"

                except KeyError:
                    # ...

                    if str(json_out["1 чтв"][str(i + 1)]) == 'None':
                        html_out += '<h8 style="color:#212121;">1 чтв.: нет.</h8>' + "<br>"

                    elif str(json_out["1 чтв"][str(i + 1)]) == '5':
                        html_out += '<h8 style="color:green;">1 чтв.: 5</h8>' + "<br>"

                    elif str(json_out["1 чтв"][str(i + 1)]) == '4':
                        html_out += '<h8 style="color:teal;">1 чтв.: 4</h8>' + "<br>"

                    elif str(json_out["1 чтв"][str(i + 1)]) == '3':
                        html_out += '<h8 style="color:#FF5722;">1 чтв.: 3</h8>' + "<br>"

                    elif str(json_out["1 чтв"][str(i + 1)]) == '2':
                        html_out += '<h8 style="color:red;">1 чтв.: 2</h8>' + "<br>"

                    elif str(json_out["1 чтв"][str(i + 1)]) == '1':
                        html_out += '<h8 style="color:red;">1 чтв.: 1</h8>' + "<br>"

                    # ...
                    if str(json_out["2 чтв"][str(i + 1)]) == 'None':
                        html_out += '<h8 style="color:#212121;">2 чтв.: нет.</h8>' + "<br>"

                    elif str(json_out["2 чтв"][str(i + 1)]) == '5':
                        html_out += '<h8 style="color:green;">2 чтв.: 5</h8>' + "<br>"

                    elif str(json_out["2 чтв"][str(i + 1)]) == '4':
                        html_out += '<h8 style="color:teal;">2 чтв.: 4</h8>' + "<br>"

                    elif str(json_out["2 чтв"][str(i + 1)]) == '3':
                        html_out += '<h8 style="color:#FF5722;">2 чтв.: 3</h8>' + "<br>"

                    elif str(json_out["2 чтв"][str(i + 1)]) == '2':
                        html_out += '<h8 style="color:red;">2 чтв.: 2</h8>' + "<br>"

                    elif str(json_out["2 чтв"][str(i + 1)]) == '1':
                        html_out += '<h8 style="color:red;">2 чтв.: 1</h8>' + "<br>"

                    # ...
                    if str(json_out["3 чтв"][str(i + 1)]) == 'None':
                        html_out += '<h8 style="color:#212121;">3 чтв.: нет.</h8>' + "<br>"

                    elif str(json_out["3 чтв"][str(i + 1)]) == '5':
                        html_out += '<h8 style="color:green;">3 чтв.: 5</h8>' + "<br>"

                    elif str(json_out["3 чтв"][str(i + 1)]) == '4':
                        html_out += '<h8 style="color:teal;">3 чтв.: 4</h8>' + "<br>"

                    elif str(json_out["3 чтв"][str(i + 1)]) == '3':
                        html_out += '<h8 style="color:#FF5722;">3 чтв.: 3</h8>' + "<br>"

                    elif str(json_out["3 чтв"][str(i + 1)]) == '2':
                        html_out += '<h8 style="color:red;">3 чтв.: 2</h8>' + "<br>"

                    elif str(json_out["3 чтв"][str(i + 1)]) == '1':
                        html_out += '<h8 style="color:red;">3 чтв.: 1</h8>' + "<br>"

                    # ...
                    if str(json_out["4 чтв"][str(i + 1)]) == 'None':
                        html_out += '<h8 style="color:#212121;">4 чтв.: нет.</h8>' + "<br>"

                    elif str(json_out["4 чтв"][str(i + 1)]) == '5':
                        html_out += '<h8 style="color:green;">4 чтв.: 5</h8>' + "<br>"

                    elif str(json_out["4 чтв"][str(i + 1)]) == '4':
                        html_out += '<h8 style="color:teal;">4 чтв.: 4</h8>' + "<br>"

                    elif str(json_out["4 чтв"][str(i + 1)]) == '3':
                        html_out += '<h8 style="color:#FF5722;">4 чтв.: 3</h8>' + "<br>"

                    elif str(json_out["4 чтв"][str(i + 1)]) == '2':
                        html_out += '<h8 style="color:red;">4 чтв.: 2</h8>' + "<br>"

                    elif str(json_out["4 чтв"][str(i + 1)]) == '1':
                        html_out += '<h8 style="color:red;">4 чтв.: 1</h8>' + "<br>"

                # ...
                if str(json_out["Год"][str(i + 1)]) == 'None':
                    html_out += '<h8 style="color:#212121;">Год.: нет.</h8>' + "<br>"

                elif str(json_out["Год"][str(i + 1)]) == '5':
                    html_out += '<h8 style="color:green;">Год.: 5</h8>' + "<br>"

                elif str(json_out["Год"][str(i + 1)]) == '4':
                    html_out += '<h8 style="color:teal;">Год.: 4</h8>' + "<br>"

                elif str(json_out["Год"][str(i + 1)]) == '3':
                    html_out += '<h8 style="color:#FF5722;">Год.: 3</h8>' + "<br>"

                elif str(json_out["Год"][str(i + 1)]) == '2':
                    html_out += '<h8 style="color:red;">Год.: 2</h8>' + "<br>"

                elif str(json_out["Год"][str(i + 1)]) == '1':
                    html_out += '<h8 style="color:red;">Год.: 1</h8>' + "<br>"

                # ...
                if str(json_out["Экзамен"][str(i + 1)]) == 'None':
                    html_out += '<h8 style="color:#212121;">Экзамен: нет.</h8>' + "<br>"

                elif str(json_out["Экзамен"][str(i + 1)]) == '5':
                    html_out += '<h8 style="color:green;">Экзамен: 5</h8>' + "<br>"

                elif str(json_out["Экзамен"][str(i + 1)]) == '4':
                    html_out += '<h8 style="color:teal;">Экзамен: 4</h8>' + "<br>"

                elif str(json_out["Экзамен"][str(i + 1)]) == '3':
                    html_out += '<h8 style="color:#FF5722;">Экзамен: 3</h8>' + "<br>"

                elif str(json_out["Экзамен"][str(i + 1)]) == '2':
                    html_out += '<h8 style="color:red;">Экзамен: 2</h8>' + "<br>"

                elif str(json_out["Экзамен"][str(i + 1)]) == '1':
                    html_out += '<h8 style="color:red;">Экзамен: 1</h8>' + "<br>"

                # ...
                if str(json_out["Итог"][str(i + 1)]) == 'None':
                    html_out += '<h8 style="color:#212121;">Итог.: нет.</h8>' + "<br>"

                elif str(json_out["Итог"][str(i + 1)]) == '5':
                    html_out += '<h8 style="color:green;">Итог.: 5</h8>' + "<br>"

                elif str(json_out["Итог"][str(i + 1)]) == '4':
                    html_out += '<h8 style="color:teal;">Итог.: 4</h8>' + "<br>"

                elif str(json_out["Итог"][str(i + 1)]) == '3':
                    html_out += '<h8 style="color:#FF5722;">Итог.: 3</h8>' + "<br>"

                elif str(json_out["Итог"][str(i + 1)]) == '2':
                    html_out += '<h8 style="color:red;">Итог.: 2</h8>' + "<br>"

                elif str(json_out["Итог"][str(i + 1)]) == '1':
                    html_out += '<h8 style="color:red;">Итог.: 1</h8>' + "<br>"

                html_out += '<div style="display:block; height:5px; clear:both;"></div>'
                html_out += '</div>'

            return jsonify(html_out)

        except (ValueError, IndexError):
            html_out = ""

            html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
            html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
            html_out += '</div>'
            html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
            html_out += '<h5>Данные не получены ¯\_(ツ)_/¯</h5>'
            html_out += 'Либо данных попросту нет, либо Дневник.Ру в оффлайне :> <br>'
            html_out += 'Если вы сумели успешно запросить данные ранее, то отключите Интернет и запросите снова.'
            html_out += '</div>'

            return jsonify(html_out)

    else:
        html_out = ""

        html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
        html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
        html_out += '</div>'
        html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
        html_out += '<h5>Залогиньтесь ¯\_(ツ)_/¯</h5>'
        html_out += 'Вы явно такого не ожидали, не правда ли?'
        html_out += '</div>'

        return jsonify(html_out)


@app.route("/dnevnik", methods=['POST'])
def dnevnik():
    if 'DnevnikLogin' in request.cookies:
        s = CacheControl(Session())

        timeMonth = request.form.get('month', '')
        timeDay = request.form.get('day', '')

        offset = int(request.cookies.get('Offset'))

        s.headers.update({'Upgrade-Insecure-Requests': '1',
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                          'DNT': '1',
                          'Accept-Encoding': 'gzip, deflate, br',
                          'Accept-Language': 'ru-RU,en-US;q=0.8,ru;q=0.6,en;q=0.4'})

        login_payload = {'login': b64decode(b32decode(request.cookies.get('DnevnikLogin').encode('ascii'))).decode('utf-8'),
                         'password': b64decode(b32decode(request.cookies.get('DnevnikPass').encode('ascii'))).decode('utf-8'),
                         'exceededAttempts': 'False', 'ReturnUrl': ''}

        s.post('https://login.dnevnik.ru/login', login_payload)

        try:
            data = s.get("https://schools.dnevnik.ru/marks.aspx?school=" + schoolId(s) + "&index=-1&tab=week&year=" + timeDate(typeDate='year', offset=offset) + "&month=" + (str(timeMonth) if timeMonth is not '' else timeDate(typeDate='month', offset=offset)) + "&day=" + (timeDate(typeDate='day', offset=offset) if timeDay is '' or timeMonth is '' else str(timeDay) if timeDate(typeDate='weekday', timeMonth=str(timeMonth), timeDay=str(timeDay), offset=offset) != '6' else str(int(timeDay) - 1))).content

        except KeyError:
            html_out = ""

            html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
            html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
            html_out += '</div>'
            html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
            html_out += '<h5>Ох, похоже, что-то не так ( ͡° ͜ʖ ͡°)</h5>'
            html_out += 'Вы - родитель. К сожалению, здесь для вас ничего нет. И вряд ли будет. Всего доброго ( ´ ∀ ` )ﾉ'
            html_out += '</div>'

            response = make_response(jsonify(html_out))
            response.set_cookie('Offset', value='', max_age=0, expires=0)
            return response

        columns = {0: 'Уроки', 1: 'Присутствие', 2: 'Оценки', 3: 'Замечания', 4: 'ДЗ'}
        tables = None
        swapped = False

        try:
            if timeMonth is '' or timeDay is '':
                if timeDate(typeDate='weekday', offset=offset) != '6':
                    tables = pd.read_html(data)[int(timeDate(typeDate='weekday', offset=offset))].rename(columns=columns)

                else:
                    tables = pd.read_html(data)[int(timeDate(typeDate='weekday', offset=offset)) - 1].rename(columns=columns)

            else:
                if timeDate(typeDate='weekday', timeMonth=str(timeMonth), timeDay=str(timeDay), offset=offset) != '6':
                    tables = pd.read_html(data)[int(timeDate(typeDate='weekday', timeMonth=timeMonth, timeDay=timeDay, offset=offset))].rename(columns=columns)

                else:
                    tables = pd.read_html(data)[int(timeDate(typeDate='weekday', timeMonth=timeMonth, timeDay=timeDay, offset=offset)) - 1].rename(columns=columns)

        except (ValueError, IndexError):
            soup = BeautifulSoup(data, "lxml")
            html_out = ""

            if soup.title.string == 'Страница не найдена (404)':
                html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
                html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
                html_out += '</div>'
                html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
                html_out += '<h5>Ох, похоже, что-то не так ( ͡° ͜ʖ ͡°)</h5>'
                html_out += 'Вы - учитель. К сожалению, здесь для вас ничего нет. И вряд ли будет. Всего доброго ( ´ ∀ ` )ﾉ'
                html_out += '</div>'

            else:
                html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
                html_out += '<i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;"></i>'
                html_out += '</div>'
                html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
                html_out += '<h5>Данные не получены ¯\_(ツ)_/¯</h5>'
                html_out += 'Либо уроков нет, либо Дневник.Ру ушел в оффлайн :> <br>'
                html_out += 'Если вы сумели успешно запросить данные ранее, то отключите Интернет и запросите снова.'
                html_out += '</div>'

            response = make_response(jsonify(html_out))
            response.set_cookie('Offset', value='', max_age=0, expires=0)
            return response

        if not str(tables['Уроки'][0]).startswith("!"):
            tables.index = range(1, len(tables) + 1)
            swapped = True

        tables['Уроки'] = tables['Уроки'].apply(lambda x: str(x)[:-6])

        json_out = loads(tables.to_json(force_ascii=False))

        html_out = ""

        html_out += '<h4 class="mdl-cell mdl-cell--12-col">Дневник</h4>'

        schedule = s.get("https://schools.dnevnik.ru/schedules/view.aspx?school=" + schoolId(s) + "&group=" + groupId(s) + "&tab=timetable").content
        columns = {0: 'Урок', 1: 'Время'}
        tables_sch = pd.read_html(schedule)[-1].rename(columns=columns)

        timing = loads(tables_sch.to_json(force_ascii=False))
        alt_grading = False

        for i in range(len(json_out['Уроки'])):
            if int(float(json_out["Оценки"][str(i)])) in range(6, 11):
                alt_grading = True

        for i in range(len(json_out['Уроки'])):
            if swapped is False:
                html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
                html_out += '<div style="display:block; height:2px; clear:both;"></div><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;">format_list_bulleted</i>'
                html_out += '</div>'
                html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
                html_out += '<div style="display:block; height:2px; clear:both;"></div>'
                html_out += '<h5 style="font-weight:600">' + str(json_out['Уроки'][str(i)]) + '</h5>'

                # ...
                if str(json_out["Присутствие"][str(i)]) == 'None':
                    html_out += '<h8 style="color:teal;">Присутствие: отмечено.</h8>' + "<br>"

                elif str(json_out["Присутствие"][str(i)]) == 'Н':
                    html_out += '<h8 style="color:red;">Присутствие: неявка.</h8>' + "<br>"

                elif str(json_out["Присутствие"][str(i)]) == 'О':
                    html_out += '<h8 style="color:#FF5722;">Присутствие: опоздание.</h8>' + "<br>"

                elif str(json_out["Присутствие"][str(i)]) == 'Б':
                    html_out += '<h8 style="color:#01579B;">Присутствие: пропуск по болезни.</h8>' + "<br>"

                elif str(json_out["Присутствие"][str(i)]) == 'П':
                    html_out += '<h8 style="color:#01579B;">Присутствие: пропуск по ув. причине.</h8>' + "<br>"

                # ...
                if alt_grading is False:
                    if str(json_out["Оценки"][str(i)]) == 'None':
                        html_out += '<h8 style="color:#212121;">Оценка: нет.</h8>' + "<br>"

                    elif str(int(float(json_out["Оценки"][str(i)]))) == '1':
                        html_out += '<h8 style="color:red;">Оценка: 1  (ノ_<)</h8>' + "<br>"

                    elif str(int(float(json_out["Оценки"][str(i)]))) == '2':
                        html_out += '<h8 style="color:red;">Оценка: 2  (・・ )</h8>' + "<br>"

                    elif str(int(float(json_out["Оценки"][str(i)]))) == '3':
                        html_out += '<h8 style="color:#FF5722;">Оценка: 3  (--_--)</h8>' + "<br>"

                    elif str(int(float(json_out["Оценки"][str(i)]))) == '4':
                        html_out += '<h8 style="color:teal;">Оценка: 4  (^_~)</h8>' + "<br>"

                    elif str(int(float(json_out["Оценки"][str(i)]))) == '5':
                        html_out += '<h8 style="color:green;">Оценка: 5  ( ˙꒳​˙ )</h8>' + "<br>"

                else:
                    if str(json_out["Оценки"][str(i)]) == 'None':
                        html_out += '<h8 style="color:#212121;">Оценка: нет.</h8>' + "<br>"

                    elif int(float(json_out["Оценки"][str(i)])) in range(0, 2):
                        html_out += '<h8 style="color:red;">Оценка: ' + str(int(float(json_out["Оценки"][str(i)]))) + '  (ノ_<)</h8>' + "<br>"

                    elif int(float(json_out["Оценки"][str(i)])) in range(2, 4):
                        html_out += '<h8 style="color:red;">Оценка: ' + str(int(float(json_out["Оценки"][str(i)]))) + '  (・・ )</h8>' + "<br>"

                    elif int(float(json_out["Оценки"][str(i)])) in range(4, 6):
                        html_out += '<h8 style="color:#FF5722;">Оценка: ' + str(int(float(json_out["Оценки"][str(i)]))) + '  (--_--)</h8>' + "<br>"

                    elif int(float(json_out["Оценки"][str(i)])) in range(6, 8):
                        html_out += '<h8 style="color:teal;">Оценка: ' + str(int(float(json_out["Оценки"][str(i)]))) + '  (^_~)</h8>' + "<br>"

                    elif int(float(json_out["Оценки"][str(i)])) in range(8, 10):
                        html_out += '<h8 style="color:green;">Оценка: ' + str(int(float(json_out["Оценки"][str(i)]))) + '  ( ˙꒳​˙ )</h8>' + "<br>"

                # ...
                if str(json_out["Замечания"][str(i)]) == 'None':
                    html_out += '<h8 style="color:teal;">Замечания: нет.</h8>' + "<br>"

                else:
                    html_out += '<h8 style="color:#212121;">Замечания: ' + str(json_out["Замечания"][str(i)]) + '</h8>' + "<br>"

                # ...
                if str(json_out["ДЗ"][str(i)]) == 'None':
                    html_out += '<h8 style="color:#212121;">ДЗ: нет.  ヽ(ー_ー )ノ</h8>' + "<br>"

                else:
                    html_out += '<h8 style="color:#212121;">ДЗ: ' + str(json_out["ДЗ"][str(i)]) + '</h8>' + "<br>"

                html_out += '<h8 style="color:#212121;">Время: ' + timing["Время"][str(i)] + '</h8>' + "<br>"
                html_out += '<div style="display:block; height:5px; clear:both;"></div>'
                html_out += '</div>'

            else:
                html_out += '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">'
                html_out += '<div style="display:block; height:2px; clear:both;"></div><i class="material-icons mdl-list__item-avatar mdl-color--primary" style="font-size:32px; padding-top:2.5px; text-align:center;">format_list_bulleted</i>'
                html_out += '</div>'
                html_out += '<div class="section__text mdl-cell mdl-cell--10-col-desktop mdl-cell--6-col-tablet mdl-cell--3-col-phone">'
                html_out += '<div style="display:block; height:2px; clear:both;"></div>'
                html_out += '<h5 style="font-weight:600">' + str(json_out['Уроки'][str(i + 1)]) + '</h5>'

                # ...
                if str(json_out["Присутствие"][str(i + 1)]) == 'None':
                    html_out += '<h8 style="color:teal;">Присутствие: отмечено.</h8>' + "<br>"

                elif str(json_out["Присутствие"][str(i + 1)]) == 'Н':
                    html_out += '<h8 style="color:red;">Присутствие: неявка.</h8>' + "<br>"

                elif str(json_out["Присутствие"][str(i + 1)]) == 'О':
                    html_out += '<h8 style="color:#FF5722;">Присутствие: опоздание.</h8>' + "<br>"

                elif str(json_out["Присутствие"][str(i + 1)]) == 'Б':
                    html_out += '<h8 style="color:#01579B;">Присутствие: пропуск по болезни.</h8>' + "<br>"

                elif str(json_out["Присутствие"][str(i + 1)]) == 'П':
                    html_out += '<h8 style="color:#01579B;">Присутствие: пропуск по ув. причине.</h8>' + "<br>"

                # ...
                if alt_grading is False:
                    if str(json_out["Оценки"][str(i + 1)]) == 'None':
                        html_out += '<h8 style="color:#212121;">Оценка: нет.</h8>' + "<br>"

                    elif str(int(float(json_out["Оценки"][str(i + 1)]))) == '1':
                        html_out += '<h8 style="color:red;">Оценка: 1  (ノ_<)</h8>' + "<br>"

                    elif str(int(float(json_out["Оценки"][str(i + 1)]))) == '2':
                        html_out += '<h8 style="color:red;">Оценка: 2  (・・ )</h8>' + "<br>"

                    elif str(int(float(json_out["Оценки"][str(i + 1)]))) == '3':
                        html_out += '<h8 style="color:#FF5722;">Оценка: 3  (--_--)</h8>' + "<br>"

                    elif str(int(float(json_out["Оценки"][str(i + 1)]))) == '4':
                        html_out += '<h8 style="color:teal;">Оценка: 4  (^_~)</h8>' + "<br>"

                    elif str(int(float(json_out["Оценки"][str(i + 1)]))) == '5':
                        html_out += '<h8 style="color:green;">Оценка: 5  ( ˙꒳​˙ )</h8>' + "<br>"

                else:
                    if str(json_out["Оценки"][str(i + 1)]) == 'None':
                        html_out += '<h8 style="color:#212121;">Оценка: нет.</h8>' + "<br>"

                    elif int(float(json_out["Оценки"][str(i + 1)])) in range(0, 2):
                        html_out += '<h8 style="color:red;">Оценка: ' + str(int(float(json_out["Оценки"][str(i + 1)]))) + '  (ノ_<)</h8>' + "<br>"

                    elif int(float(json_out["Оценки"][str(i + 1)])) in range(2, 4):
                        html_out += '<h8 style="color:red;">Оценка: ' + str(int(float(json_out["Оценки"][str(i + 1)]))) + '  (・・ )</h8>' + "<br>"

                    elif int(float(json_out["Оценки"][str(i + 1)])) in range(4, 6):
                        html_out += '<h8 style="color:#FF5722;">Оценка: ' + str(int(float(json_out["Оценки"][str(i + 1)]))) + '  (--_--)</h8>' + "<br>"

                    elif int(float(json_out["Оценки"][str(i + 1)])) in range(6, 8):
                        html_out += '<h8 style="color:teal;">Оценка: ' + str(int(float(json_out["Оценки"][str(i + 1)]))) + '  (^_~)</h8>' + "<br>"

                    elif int(float(json_out["Оценки"][str(i + 1)])) in range(8, 10):
                        html_out += '<h8 style="color:green;">Оценка: ' + str(int(float(json_out["Оценки"][str(i + 1)]))) + '  ( ˙꒳​˙ )</h8>' + "<br>"

                # ...
                if str(json_out["Замечания"][str(i + 1)]) == 'None':
                    html_out += '<h8 style="color:teal;">Замечания: нет.</h8>' + "<br>"

                else:
                    html_out += '<h8 style="color:#212121;">Замечания: ' + str(json_out["Замечания"][str(i + 1)]) + '</h8>' + "<br>"

                # ...
                if str(json_out["ДЗ"][str(i + 1)]) == 'None':
                    html_out += '<h8 style="color:#212121;">ДЗ: нет.  ヽ(ー_ー )ノ</h8>' + "<br>"

                else:
                    html_out += '<h8 style="color:#212121;">ДЗ: ' + str(json_out["ДЗ"][str(i + 1)]) + '</h8>' + "<br>"

                html_out += '<h8 style="color:#212121;">Время: ' + timing["Время"][str(i + 1)] + '</h8>' + "<br>"
                html_out += '<div style="display:block; height:5px; clear:both;"></div>'
                html_out += '</div>'

        response = make_response(jsonify(html_out))
        response.set_cookie('Offset', value='', max_age=0, expires=0)
        return response

    else:
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


@app.route("/login", methods=['POST'])
def login():
    login = request.form.get('username', '')
    password = request.form.get('password', '')
    if login is not '' and password is not '':
        s = CacheControl(Session())

        s.headers.update({'Upgrade-Insecure-Requests': '1',
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                          'DNT': '1',
                          'Accept-Encoding': 'gzip, deflate, br',
                          'Accept-Language': 'ru-RU,en-US;q=0.8,ru;q=0.6,en;q=0.4'})

        login_payload = {'login': login, 'password': password,
                         'exceededAttempts': 'False', 'ReturnUrl': ''}

        s.post('https://login.dnevnik.ru/login', login_payload)

        try:
            s.cookies.get_dict()['DnevnikAuth_a']

        except KeyError:
            html_out = ""

            html_out += '<div style="display:block; height:2px; clear:both;"></div>'
            html_out += '<p style="text-align:center; color:red;">Данные неверны, либо Дневник.Ру в оффлайне ¯\_(ツ)_/¯</p>'

            return jsonify(html_out)

        response = make_response(render_template_string('<script>window.location.replace("/");</script>'))

        response.set_cookie('DnevnikLogin', value=b32encode(b64encode(login.encode('ascii'))).decode('utf-8'), max_age=2592000, expires=2592000)
        response.set_cookie('DnevnikPass', value=b32encode(b64encode(password.encode('ascii'))).decode('utf-8'), max_age=2592000, expires=2592000)

        return response

    else:
        html_out = ""

        html_out += '<div style="display:block; height:2px; clear:both;"></div>'
        html_out += '<p style="text-align:center; color:red;">Данные отсутствуют ¯\_(ツ)_/¯</p>'

        return jsonify(html_out)


@app.route("/logout", methods=['GET'])
def logout():
    response = make_response(redirect('/'))

    if 'DnevnikLogin' in request.cookies:
            response.set_cookie('DnevnikLogin', value='', max_age=0, expires=0)
            response.set_cookie('DnevnikPass', value='', max_age=0, expires=0)

    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Cache-Control'] = 'no-cache'
    return response


'''
Frontend handling
'''


@app.route('/images/<path:path>', methods=['GET'])
def serve_images(path):
    return send_from_directory('static/images', path)


@app.route('/sw.js', methods=['GET'])
def serviceworker():
    return send_from_directory('static/js', 'sw.js')


@app.route('/js/<path:path>', methods=['GET'])
def serve_js(path):
    if path != 'sw.js':
        return send_from_directory('static/js', path)


@app.route('/css/<path:path>', methods=['GET'])
def serve_css(path):
    return send_from_directory('static/css', path)


@app.route('/config/<path:path>', methods=['GET'])
def serve_config(path):
    return send_from_directory('static/config', path)


@app.route('/fonts/<path:path>', methods=['GET'])
def serve_fonts(path):
    return send_from_directory('static/fonts', path)


if __name__ == "__main__":
    chdir(dirname(abspath(__file__)))
    serve(app, host='0.0.0.0', port=argv[1])
