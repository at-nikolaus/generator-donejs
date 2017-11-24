import DefineMap from 'can-define/map/';
export const ViewModel = DefineMap.extend({
  message: {
    value: 'This is the <%= tag %> component'
  }
});

export default ViewModel
