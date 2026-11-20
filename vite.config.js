export default {
 base:'./',
 optimizeDeps:{exclude:['three']},
 server:{watch:{ignored:['**/.qa/**','**/docs/demo/**','**/docs/proof/**']}}
};