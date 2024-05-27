import dayjs from 'dayjs';
import {POINT_TYPES, DESTINATIONS, EDITING_TYPE} from '../const.js';
import {getLastWord, camelizer, fullDate} from '../utils.js';
import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import DatePicker from '../date-picker';
import he from 'he';

const BLANK_POINT = {
  type: 'flight',
  dateFrom: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
  dateTo: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
  basePrice: 0,
  offers: [],
  destination: null
};

function createEventSelector() {
  function createEventItems() {
    return POINT_TYPES.map((item) => (`
      <div class="event__type-item">
        <input id="event-type-${item}-1" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${item}">
        <label class="event__type-label  event__type-label--${item}" for="event-type-${item}-1">${camelizer(item)}</label>
      </div>
    `)).join('');
  }

  return (`
    <input class="event__type-toggle  visually-hidden" id="event-type-toggle-1" type="checkbox">
    <div class="event__type-list">
      <fieldset class="event__type-group">
        <legend class="visually-hidden">Event type</legend>
        ${createEventItems()}
      </fieldset>
    </div>
  `);
}

function createOffersSelector({offers, currentOffers}) {
  function createOfferItem() {
    return currentOffers.map((item) => {
      const checkedClassname = offers.some((curValue) => (curValue.id === item.id)) ? 'checked' : '';
      const slug = getLastWord(item.title);
      return `
        <div class="event__offer-selector">
          <input class="event__offer-checkbox visually-hidden" id="event-offer-${slug}-${item.id}" type="checkbox" name="event-offer-${slug}" ${checkedClassname}>
          <label class="event__offer-label" for="event-offer-${slug}-${item.id}">
            <span class="event__offer-title">${item.title}</span>
              &plus;&euro;&nbsp;
            <span class="event__offer-price">${item.price}</span>
          </label>
        </div>
      `;
    }).join('');
  }

  return currentOffers
    ? `
      <section class="event__section  event__section--offers">
        <h3 class="event__section-title  event__section-title--offers">Offers</h3>
        <div class="event__available-offers">
          ${createOfferItem()}
        </div>
      </section>
    `
    : '';
}

function createDestinationSection(destination) {
  const { description, pictures, name } = destination;

  function createPicturesSection() {
    return pictures
      ? `
        <div class="event__photos-container">
          <div class="event__photos-tape">
            ${pictures.map((item) => (`<img class="event__photo" src="${item.src}" alt="${item.description}">`)).join('')}
          </div>
        </div>
      `
      : '';
  }

  return name
    ? `
      <section class="event__section  event__section--destination">
        <h3 class="event__section-title event__section-title--destination">Destination</h3>
        <p class="event__destination-description">${description}</p>
        ${createPicturesSection()}
      </section>
    `
    : '';
}

function createDestinationList() {
  return `
    <datalist id="destination-list-1">
      ${DESTINATIONS.map((item) => (`<option value="${item}"></option>`)).join('')}
    </datalist>
  `;
}

function createEditPointTemplate({ point, destinations, allOffers }) {
  const { type, dateFrom, dateTo, basePrice, destination, offers } = point;
  const currentDestination = destinations.find((dest) => dest.id === destination);
  const currentOffers = allOffers.find((offer) => offer.type === type)?.offers;
  return `
    <li class="trip-events__item"><form class="event event--edit" action="#" method="post">
    <header class="event__header">
      <div class="event__type-wrapper">
        <label class="event__type  event__type-btn" for="event-type-toggle-1">
          <span class="visually-hidden">Choose event type</span>
          <img class="event__type-icon" width="17" height="17" src="img/icons/${type}.png" alt="Event type icon">
        </label>
        ${createEventSelector()}
      </div>

      <div class="event__field-group  event__field-group--destination">
        <label class="event__label  event__type-output" for="event-destination-1">
          ${camelizer(type)}
        </label>
        <input class="event__input  event__input--destination" id="event-destination-1" type="text" name="event-destination" value="${currentDestination ? he.encode(currentDestination.name) : ''}" list="destination-list-1">
        ${createDestinationList()}
      </div>

      <div class="event__field-group  event__field-group--time">
        <label class="visually-hidden" for="event-start-time-1">From</label>
        <input class="event__input  event__input--time" id="event-start-time-1" type="text" name="event-start-time" value="${fullDate(dateFrom)}">
        &mdash;
        <label class="visually-hidden" for="event-end-time-1">To</label>
        <input class="event__input  event__input--time" id="event-end-time-1" type="text" name="event-end-time" value="${fullDate(dateTo)}">
      </div>

      <div class="event__field-group  event__field-group--price">
        <label class="event__label" for="event-price-1">
          <span class="visually-hidden">Price</span>
          &euro;
        </label>
        <input class="event__input  event__input--price" id="event-price-1" type="text" name="event-price" value="${basePrice}">
      </div>

      <button class="event__save-btn btn btn--blue" type="submit">Save</button>
      <button class="event__reset-btn" type="reset">Delete</button>
      <button class="event__rollup-btn" type="button">
        <span class="visually-hidden">Open event</span>
      </button>
    </header>
    <section class="event__details">
      ${createOffersSelector({offers, currentOffers})}
      ${currentDestination ? createDestinationSection(currentDestination) : ''}
    </section>
  </form></li>`;
}

export default class EditPointView extends AbstractStatefulView{
  #handleFormSubmit = null;
  #handleFormReset = null;
  #handleDeleteClick = null;

  #destinations = null;
  #offers = null;
  #type = null;

  #datePickerFrom = null;
  #datePickerTo = null;

  constructor({ point = BLANK_POINT, onFormSubmit, onFormReset, destinations, offers, onDeleteClick, type = EDITING_TYPE.UPDATE }) {
    super();
    this.#destinations = destinations;
    this.#offers = offers;
    this.#type = type;
    this.#handleFormSubmit = onFormSubmit;
    this.#handleFormReset = onFormReset;
    this.#handleDeleteClick = onDeleteClick;
    this._setState(EditPointView.parsePointToState(point));
    this._restoreHandlers();
  }

  get template() {
    return createEditPointTemplate({ point: this._state, destinations: this.#destinations, allOffers: this.#offers, typeForm: this.#type });
  }

  _restoreHandlers() {
    this.element.querySelector('form').addEventListener('submit', this.#formSubmitHandler);
    this.element.querySelector('.event__rollup-btn')?.addEventListener('click', this.#formResetHandler);
    this.element.querySelector('.event__type-group').addEventListener('change', this.#typeChangeHandler);
    this.element.querySelector('.event__input--destination').addEventListener('change', this.#destinationChangeHandler);
    this.element.querySelector('.event__input--price').addEventListener('change', this.#priceChangeHandler);
    this.element.querySelector('.event__available-offers')?.addEventListener('change', this.#offersChangeHandler);
    this.element.querySelector('.event__reset-btn').addEventListener('click', this.#formDeleteClickHandler);
    this.#setDatePickers();
  }

  removeElement = () => {
    super.removeElement();

    if (this.#datePickerFrom) {
      this.#datePickerFrom.destroy();
      this.#datePickerFrom = null;
    }

    if (this.#datePickerTo) {
      this.#datePickerTo.destroy();
      this.#datePickerTo = null;
    }
  };

  #setDatePickers = () => {
    this.#datePickerFrom = new DatePicker({
      element: this.element.querySelector('#event-start-time-1'),
      defaultDate: this._state.dateFrom,
      maxDate: this._state.dateTo,
      onClose: this.#dateFromCloseHandler,
    });

    this.#datePickerTo = new DatePicker({
      element: this.element.querySelector('#event-end-time-1'),
      defaultDate: this._state.dateTo,
      minDate: this._state.dateFrom,
      onClose: this.#dateToCloseHandler,
    });
  };

  #dateFromCloseHandler = ([userDate]) => {
    this._setState({
      dateFrom: userDate
    });

    this.#datePickerTo.setMinDate(this._state.dateFrom);
  };

  #dateToCloseHandler = ([userDate]) => {
    this._setState({
      dateTo: userDate
    });

    this.#datePickerFrom.setMaxDate(this._state.dateTo);
  };

  #formResetHandler = (evt) => {
    evt.preventDefault();
    this.#handleFormReset();
  };

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    if (!this._state.destination || !this._state.dateFrom || !this._state.dateTo || isNaN(this._state.basePrice)) {
      return;
    }
    this.#handleFormSubmit(EditPointView.parseStateToPoint(this._state));
  };

  #formDeleteClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleDeleteClick(EditPointView.parseStateToPoint(this._state));
  };

  #typeChangeHandler = (evt) => {
    evt.preventDefault();
    this.updateElement({
      ...this._state,
      type: evt.target.value,
      offers: [],
    });
  };

  #priceChangeHandler = (evt) => {
    this._setState({
      basePrice: evt.target.value,
    });
  };

  #destinationChangeHandler = (evt) => {
    const selectedDestination = this.#destinations.find((dest) => dest.name === evt.target.value).id;
    this.updateElement({
      destination: selectedDestination,
    });
  };

  #offersChangeHandler = () => {
    const selectedOffers = Array.from(this.element.querySelectorAll('.event__offer-checkbox:checked'))
      .map(({ id }) => id.split('-').slice(3).join('-'));

    this._setState({
      offers: selectedOffers
    });
  };


  reset = (point) => {
    this.updateElement(EditPointView.parsePointToState(point));
  };

  static parsePointToState = (point) => ({ ...point });

  static parseStateToPoint = (state) => ({ ...state });
}
