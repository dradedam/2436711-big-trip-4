import { render, replace, remove } from '../framework/render.js';
import PointView from '../view/point-view.js';
import EditPointView from '../view/edit-point-view';

const Mode = {
  DEFAULT: 'DEFAULT',
  EDITING: 'EDITING',
};

export default class PointPresenter {
  mode = Mode.DEFAULT;

  constructor({ pointsListContainer, onDataChange, onModeChange, destinationsModel, offersModel }) {
    this.pointListContainer = pointsListContainer;
    this.onDataChange = onDataChange;
    this.onModeChange = onModeChange;
    this.destinationsModel = destinationsModel;
    this.offersModel = offersModel;
  }

  init(point) {
    this.point = point;

    const prevPointComponent = this.pointComponent;
    const prevPointEditComponent = this.pointEditComponent;

    this.pointComponent = new PointView({
      point: this.point,
      destination: this.destinationsModel.getDestinationById(point.destination),
      offers: this.offersModel.getOffersByType(point.type),
      onEditClick: this.handleEditClick,
      onFavoriteClick: this.handleFavoriteClick,
    });

    this.pointEditComponent = new EditPointView({
      point: this.point,
      destinations: this.destinationsModel.getDestinations(),
      offers: this.offersModel.getOffers(),
      onFormReset: this.handleFormReset,
      onFormSubmit: this.handleFormSubmit,
    });

    if (prevPointComponent === undefined || prevPointEditComponent === undefined) {
      render(this.pointComponent, this.pointListContainer);
      return;
    }

    if (this.mode === Mode.DEFAULT) {
      replace(this.pointComponent, prevPointComponent);
    }

    if (this.mode === Mode.EDITING) {
      replace(this.pointEditComponent, prevPointEditComponent);
    }

    remove(prevPointComponent);
    remove(prevPointEditComponent);
  }

  destroy() {
    remove(this.pointComponent);
    remove(this.pointEditComponent);
  }

  resetView = () => {
    if (this.mode !== Mode.DEFAULT) {
      this.replaceFormToCard();
    }
  };

  handleFavoriteClick = () => {
    this.onDataChange({...this.point, isFavorite: !this.point.isFavorite});
  };

  replaceCardToForm() {
    replace(this.pointEditComponent, this.pointComponent);
    document.addEventListener('keydown', this.escKeyDownHandler);
    this.onModeChange();
    this.mode = Mode.EDITING;
  }

  replaceFormToCard() {
    replace(this.pointComponent, this.pointEditComponent);
    document.removeEventListener('keydown', this.escKeyDownHandler);
    this.mode = Mode.DEFAULT;
  }

  escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      this.pointEditComponent.reset(this.point);
      this.replaceFormToCard();
    }
  };

  handleEditClick = () => {
    this.replaceCardToForm();
  };

  handleFormSubmit = (updatedPoint) => {
    this.point = updatedPoint;
    this.replaceFormToCard();
  };

  handleFormReset = () => {
    this.pointEditComponent.reset(this.point);
    this.replaceFormToCard();
  };
}
